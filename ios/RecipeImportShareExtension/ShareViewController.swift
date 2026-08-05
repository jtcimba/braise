import UIKit

class ShareViewController: UIViewController {

    private var hasProcessed = false
    private var activityIndicator: UIActivityIndicatorView?

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground

        let indicator = UIActivityIndicatorView(style: .large)
        indicator.translatesAutoresizingMaskIntoConstraints = true
        indicator.autoresizingMask = [.flexibleLeftMargin, .flexibleRightMargin, .flexibleTopMargin, .flexibleBottomMargin]
        indicator.center = CGPoint(x: view.bounds.midX, y: view.bounds.midY)
        indicator.startAnimating()
        view.addSubview(indicator)
        activityIndicator = indicator
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        guard !hasProcessed else {
            return
        }
        hasProcessed = true

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            self.processShare()
        }
    }

    // MARK: - Share Processing

    // TikTok and Instagram go through the async social-video job (yt-dlp via metadata server).
    // YouTube is intentionally excluded — its pages are better fetched from the user's device
    // to avoid server-side bot detection (same reason the in-app link import fetches HTML locally).
    private func isSocialVideoURL(_ urlString: String) -> Bool {
        let socialDomains = ["tiktok.com", "vm.tiktok.com", "instagram.com"]
        guard let host = URL(string: urlString)?.host?.lowercased() else { return false }
        return socialDomains.contains { host == $0 || host.hasSuffix("." + $0) }
    }

    private func isYouTubeURL(_ urlString: String) -> Bool {
        guard let host = URL(string: urlString)?.host?.lowercased() else { return false }
        return host == "youtube.com" || host.hasSuffix(".youtube.com") || host == "youtu.be"
    }

    private func platformForURL(_ urlString: String) -> String {
        guard let host = URL(string: urlString)?.host?.lowercased() else { return "unknown" }
        if host.contains("tiktok") { return "tiktok" }
        if host.contains("instagram") { return "instagram" }
        return "unknown"
    }

    private func processShare() {
        guard let extensionContext = extensionContext,
              let item = extensionContext.inputItems.first as? NSExtensionItem,
              let attachments = item.attachments, !attachments.isEmpty else {
            completeRequest()
            return
        }

        // Subscription gate
        let sharedDefaults = UserDefaults(suiteName: "group.com.braise.recipe")
        let isPro = sharedDefaults?.string(forKey: "isPro") == "true"
        guard isPro else {
            if let paywallURL = URL(string: "braise://paywall") {
                extensionContext.open(paywallURL) { _ in
                    self.completeRequest()
                }
            } else {
                completeRequest()
            }
            return
        }

        // Try to extract a URL (public.url or public.plain-text containing a URL)
        extractURL(from: attachments) { [weak self] urlString in
            guard let self = self else { return }

            if let urlString = urlString {
                if self.isYouTubeURL(urlString) {
                    self.handleYouTubeURL(urlString)
                    return
                }

                if self.isSocialVideoURL(urlString) {
                    let platform = self.platformForURL(urlString)
                    self.submitSocialJob(url: urlString, platform: platform)
                    return
                }
            }

            // Non-social URL: existing HTML import flow (uses public.html from share payload)
            self.extractHTML(from: attachments) { [weak self] html, url in
                guard let self = self else { return }

                guard html != nil || url != nil else {
                    self.completeRequest()
                    return
                }

                // Truncate large HTML payloads; if no HTML, the edge function fetches server-side via url
                let trimmedHTML = html.map { String($0.prefix(200_000)) }
                self.fetchRecipeFromAPI(html: trimmedHTML, url: url)
            }
        }
    }

    // MARK: - URL Extraction

    private func extractURL(from attachments: [NSItemProvider], completion: @escaping (String?) -> Void) {
        // Try public.url first
        if let provider = attachments.first(where: { $0.hasItemConformingToTypeIdentifier("public.url") }) {
            provider.loadItem(forTypeIdentifier: "public.url", options: nil) { item, _ in
                if let url = item as? URL {
                    completion(url.absoluteString)
                } else {
                    // Loading failed — fall through to plain-text
                    self.extractURLFromPlainText(attachments: attachments, completion: completion)
                }
            }
            return
        }
        extractURLFromPlainText(attachments: attachments, completion: completion)
    }

    private func extractURLFromPlainText(attachments: [NSItemProvider], completion: @escaping (String?) -> Void) {
        guard let provider = attachments.first(where: { $0.hasItemConformingToTypeIdentifier("public.plain-text") }) else {
            completion(nil)
            return
        }
        provider.loadItem(forTypeIdentifier: "public.plain-text", options: nil) { item, _ in
            guard let text = item as? String else {
                completion(nil)
                return
            }
            // YouTube Shorts share as "Title\nhttps://..." so scan for first URL in the text
            let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue)
            let range = NSRange(text.startIndex..., in: text)
            if let match = detector?.firstMatch(in: text, range: range), let url = match.url {
                completion(url.absoluteString)
            } else {
                completion(nil)
            }
        }
    }

    // MARK: - YouTube Handling

    private func handleYouTubeURL(_ urlString: String) {
        // UIPasteboard must be accessed on the main thread.
        // showInfoMessage also dispatches to main, so both run in queue order.
        DispatchQueue.main.async {
            UIPasteboard.general.string = urlString
        }
        showInfoMessage(
            "YouTube videos can't be imported from the share sheet.\n\nYour link has been copied — open Braise and paste it to import.",
            fontSize: 15, weight: .regular, delay: 2.5
        ) { [weak self] in
            guard let self = self else { return }
            if let braiseURL = URL(string: "braise://") {
                self.extensionContext?.open(braiseURL) { _ in self.completeRequest() }
            } else {
                self.completeRequest()
            }
        }
    }

    // MARK: - Info Message

    private func showInfoMessage(
        _ text: String,
        fontSize: CGFloat,
        weight: UIFont.Weight,
        delay: TimeInterval,
        onDismiss: @escaping () -> Void
    ) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.activityIndicator?.stopAnimating()
            self.activityIndicator?.isHidden = true

            let label = UILabel()
            label.translatesAutoresizingMaskIntoConstraints = false
            label.text = text
            label.numberOfLines = 0
            label.textAlignment = .center
            label.font = UIFont.systemFont(ofSize: fontSize, weight: weight)
            label.textColor = .label
            self.view.addSubview(label)
            NSLayoutConstraint.activate([
                label.centerXAnchor.constraint(equalTo: self.view.centerXAnchor),
                label.centerYAnchor.constraint(equalTo: self.view.centerYAnchor),
                label.leadingAnchor.constraint(greaterThanOrEqualTo: self.view.leadingAnchor, constant: 24),
                label.trailingAnchor.constraint(lessThanOrEqualTo: self.view.trailingAnchor, constant: -24),
            ])

            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                onDismiss()
            }
        }
    }

    // MARK: - Social Job Submission

    private func submitSocialJob(url: String, platform: String) {
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.braise.recipe"),
              let supabaseURL = sharedDefaults.string(forKey: "supabaseURL"),
              let accessToken = sharedDefaults.string(forKey: "supabaseAccessToken"),
              let apiURL = URL(string: "\(supabaseURL)/functions/v1/process-social-video") else {
            finishWithResult(success: false)
            return
        }

        var request = URLRequest(url: apiURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.timeoutInterval = 15.0

        guard let body = try? JSONSerialization.data(withJSONObject: ["url": url, "platform": platform]) else {
            finishWithResult(success: false)
            return
        }
        request.httpBody = body

        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self else { return }

            if let data = data,
               let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let jobId = json["job_id"] as? String {
                sharedDefaults.set(jobId, forKey: "pendingSocialJobId")
                sharedDefaults.synchronize()
                self.finishSocialSubmission()
            } else {
                self.finishWithResult(success: false)
            }
        }.resume()
    }

    private func finishSocialSubmission() {
        showInfoMessage(
            "Adding to Braise...\nopen the app to view recipe",
            fontSize: 17, weight: .semibold, delay: 1.5
        ) { [weak self] in
            self?.completeRequest()
        }
    }

    // MARK: - Result Handling

    private func finishWithResult(success: Bool) {
        showResultAnimation(success: success) {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                if success, let url = URL(string: "braise://import-complete") {
                    self.extensionContext?.open(url) { _ in
                        self.completeRequest()
                    }
                } else {
                    self.completeRequest()
                }
            }
        }
    }

    private func saveAndFinish(_ recipe: [String: Any]) {
        saveRecipeToSupabase(recipe) { success, savedRecipe in
            if success, let savedRecipe = savedRecipe {
                if let sharedDefaults = UserDefaults(suiteName: "group.com.braise.recipe"),
                   let jsonData = try? JSONSerialization.data(withJSONObject: savedRecipe) {
                    sharedDefaults.set(jsonData, forKey: "importedRecipe")
                    sharedDefaults.synchronize()
                }
                self.structureIngredients(
                    recipeId: savedRecipe["id"],
                    ingredients: recipe["ingredients"] as? String
                )
            }
            self.finishWithResult(success: success)
        }
    }

    private func structureIngredients(recipeId: Any?, ingredients: String?) {
        guard let recipeId = recipeId,
              let ingredients = ingredients, !ingredients.isEmpty,
              let sharedDefaults = UserDefaults(suiteName: "group.com.braise.recipe"),
              let accessToken = sharedDefaults.string(forKey: "supabaseAccessToken"),
              let supabaseURL = sharedDefaults.string(forKey: "supabaseURL"),
              let apiURL = URL(string: "\(supabaseURL)/functions/v1/structure-ingredients") else {
            return
        }

        let lines = ingredients.split(separator: "\n")
            .map(String.init)
            .filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }
        guard !lines.isEmpty else { return }

        var request = URLRequest(url: apiURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.timeoutInterval = 30.0

        let body: [String: Any] = ["recipe_id": recipeId, "ingredient_lines": lines]
        guard let jsonData = try? JSONSerialization.data(withJSONObject: body) else { return }
        request.httpBody = jsonData

        URLSession.shared.dataTask(with: request) { _, _, _ in }.resume()
    }

    // MARK: - HTML Extraction

    private func extractHTML(from attachments: [NSItemProvider], completion: @escaping (String?, String?) -> Void) {
        let group = DispatchGroup()
        var foundHTML: String?
        var foundURL: String?
        var hasEnteredGroup = false

        for provider in attachments {
            if provider.hasItemConformingToTypeIdentifier("public.url") {
                hasEnteredGroup = true
                group.enter()
                provider.loadItem(forTypeIdentifier: "public.url", options: nil) { item, _ in
                    defer { group.leave() }
                    if let url = item as? URL {
                        foundURL = url.absoluteString
                    }
                }
            }

            if provider.hasItemConformingToTypeIdentifier("public.html") {
                hasEnteredGroup = true
                group.enter()
                provider.loadItem(forTypeIdentifier: "public.html", options: nil) { item, _ in
                    defer { group.leave() }
                    if let html = item as? String {
                        foundHTML = html
                    } else if let data = item as? Data, let html = String(data: data, encoding: .utf8) {
                        foundHTML = html
                    } else if let url = item as? URL {
                        if let data = try? Data(contentsOf: url), let html = String(data: data, encoding: .utf8) {
                            foundHTML = html
                        }
                    }
                }
            }
        }

        if !hasEnteredGroup {
            DispatchQueue.main.async {
                completion(nil, nil)
            }
            return
        }

        group.notify(queue: .main) {
            completion(foundHTML, foundURL)
        }
    }

    // MARK: - API

    private func fetchRecipeFromAPI(html: String?, url: String?) {
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.braise.recipe"),
              let supabaseURL = sharedDefaults.string(forKey: "supabaseURL"),
              let anonKey = sharedDefaults.string(forKey: "supabaseAnonKey"),
              let apiURL = URL(string: "\(supabaseURL)/functions/v1/import-recipe") else {
            finishWithResult(success: false)
            return
        }

        var requestBody: [String: Any] = [:]
        if let htmlStr = html { requestBody["html"] = htmlStr }
        if let urlString = url { requestBody["url"] = urlString }
        guard !requestBody.isEmpty else {
            finishWithResult(success: false)
            return
        }

        var request = URLRequest(url: apiURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        // Anon key never expires — import-recipe doesn't need user-level auth
        request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        request.timeoutInterval = 30.0

        guard let jsonData = try? JSONSerialization.data(withJSONObject: requestBody) else {
            finishWithResult(success: false)
            return
        }

        request.httpBody = jsonData

        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self else { return }

            guard error == nil,
                  let httpResponse = response as? HTTPURLResponse,
                  (200..<300).contains(httpResponse.statusCode),
                  let data = data,
                  let jsonAny = try? JSONSerialization.jsonObject(with: data),
                  let recipe = jsonAny as? [String: Any] else {
                self.finishWithResult(success: false)
                return
            }

            self.saveAndFinish(recipe)
        }.resume()
    }

    private func saveRecipeToSupabase(_ recipe: [String: Any], completion: @escaping (Bool, [String: Any]?) -> Void) {
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.braise.recipe") else {
            completion(false, nil)
            return
        }

        guard let supabaseURL = sharedDefaults.string(forKey: "supabaseURL"),
              let supabaseAnonKey = sharedDefaults.string(forKey: "supabaseAnonKey"),
              let accessToken = sharedDefaults.string(forKey: "supabaseAccessToken"),
              let userId = sharedDefaults.string(forKey: "supabaseUserId") else {
            completion(false, nil)
            return
        }

        // Pick only columns that exist in the recipes table
        func nullIfEmpty(_ val: Any?) -> Any {
            if let s = val as? String { return s.isEmpty ? NSNull() : s }
            return val ?? NSNull()
        }
        let processedRecipe: [String: Any] = [
            "user_id": userId,
            "title": nullIfEmpty(recipe["title"]),
            "author": nullIfEmpty(recipe["author"]),
            "host_url": nullIfEmpty(recipe["host_url"]),
            "host_name": nullIfEmpty(recipe["host_name"]),
            "image": nullIfEmpty(recipe["image"]),
            "total_time": recipe["total_time"] ?? NSNull(),
            "total_time_unit": nullIfEmpty(recipe["total_time_unit"]),
            "servings": recipe["servings"] ?? NSNull(),
            "instructions": nullIfEmpty(recipe["instructions"]),
            "categories": nullIfEmpty(recipe["categories"]),
            "about": nullIfEmpty(recipe["about"]),
        ]

        guard let apiURL = URL(string: "\(supabaseURL)/rest/v1/recipes") else {
            completion(false, nil)
            return
        }

        var request = URLRequest(url: apiURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue(supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("return=representation", forHTTPHeaderField: "Prefer")
        request.timeoutInterval = 30.0

        guard let jsonData = try? JSONSerialization.data(withJSONObject: processedRecipe) else {
            completion(false, nil)
            return
        }

        request.httpBody = jsonData

        URLSession.shared.dataTask(with: request) { data, response, error in
            if error != nil {
                completion(false, nil)
                return
            }

            guard let httpResponse = response as? HTTPURLResponse else {
                completion(false, nil)
                return
            }

            if (200..<300).contains(httpResponse.statusCode) {
                let savedRecipe = data
                    .flatMap { try? JSONSerialization.jsonObject(with: $0) as? [[String: Any]] }
                    .flatMap { $0.first }
                completion(true, savedRecipe)
            } else {
                completion(false, nil)
            }
        }.resume()
    }

    // MARK: - UI

    private func showResultAnimation(success: Bool, completion: @escaping () -> Void) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            self.activityIndicator?.stopAnimating()
            self.activityIndicator?.isHidden = true

            let containerView = UIView()
            containerView.translatesAutoresizingMaskIntoConstraints = false
            containerView.alpha = 0
            self.view.addSubview(containerView)

            NSLayoutConstraint.activate([
                containerView.centerXAnchor.constraint(equalTo: self.view.centerXAnchor),
                containerView.centerYAnchor.constraint(equalTo: self.view.centerYAnchor)
            ])

            let iconName = success ? "checkmark.circle.fill" : "xmark.circle.fill"
            let labelText = success ? "Recipe Saved" : "Failed to add recipe"
            let tintColor: UIColor = success ? .black : .label

            let iconImageView = UIImageView()
            iconImageView.translatesAutoresizingMaskIntoConstraints = false
            let config = UIImage.SymbolConfiguration(pointSize: 60, weight: .medium, scale: .large)
            iconImageView.image = UIImage(systemName: iconName, withConfiguration: config)
            iconImageView.tintColor = tintColor
            iconImageView.contentMode = .scaleAspectFit
            containerView.addSubview(iconImageView)

            let label = UILabel()
            label.translatesAutoresizingMaskIntoConstraints = false
            label.text = labelText
            label.font = UIFont.systemFont(ofSize: 20, weight: .semibold)
            label.textColor = .label
            label.textAlignment = .center
            containerView.addSubview(label)

            NSLayoutConstraint.activate([
                iconImageView.topAnchor.constraint(equalTo: containerView.topAnchor),
                iconImageView.centerXAnchor.constraint(equalTo: containerView.centerXAnchor),
                iconImageView.widthAnchor.constraint(equalToConstant: 80),
                iconImageView.heightAnchor.constraint(equalToConstant: 80),

                label.topAnchor.constraint(equalTo: iconImageView.bottomAnchor, constant: 16),
                label.centerXAnchor.constraint(equalTo: containerView.centerXAnchor),
                label.bottomAnchor.constraint(equalTo: containerView.bottomAnchor)
            ])

            iconImageView.transform = CGAffineTransform(scaleX: 0.1, y: 0.1)

            UIView.animate(withDuration: 0.3, delay: 0, usingSpringWithDamping: 0.6, initialSpringVelocity: 0.5, options: [], animations: {
                containerView.alpha = 1.0
                iconImageView.transform = CGAffineTransform(scaleX: 1.0, y: 1.0)
            }) { _ in
                UIView.animate(withDuration: 0.2, animations: {
                    iconImageView.transform = CGAffineTransform(scaleX: 0.95, y: 0.95)
                }) { _ in
                    UIView.animate(withDuration: 0.2) {
                        iconImageView.transform = .identity
                    }
                    completion()
                }
            }
        }
    }

    private func completeRequest() {
        activityIndicator?.stopAnimating()
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let context = self.extensionContext else { return }
            context.completeRequest(returningItems: nil, completionHandler: nil)
        }
    }
}
