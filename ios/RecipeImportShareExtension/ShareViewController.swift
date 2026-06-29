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

    private func processShare() {
        guard let extensionContext = extensionContext,
              let item = extensionContext.inputItems.first as? NSExtensionItem,
              let attachments = item.attachments, !attachments.isEmpty else {
            completeRequest()
            return
        }

        extractHTML(from: attachments) { [weak self] html, url in
            guard let self = self else { return }

            if html == nil, let urlString = url, let fetchURL = URL(string: urlString) {
                self.fetchHTML(from: fetchURL) { [weak self] fetchedHTML in
                    guard let self = self else { return }
                    guard let html = fetchedHTML else {
                        self.finishWithResult(success: false)
                        return
                    }
                    self.fetchRecipeFromAPI(html: html, url: url)
                }
                return
            }

            guard let html = html else {
                self.completeRequest()
                return
            }

            self.fetchRecipeFromAPI(html: html, url: url)
        }
    }

    // MARK: - Result Handling

    private func finishWithResult(success: Bool) {
        showResultAnimation(success: success) {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                self.completeRequest()
            }
        }
    }

    private func saveAndFinish(_ recipe: [String: Any]) {
        saveRecipeToSupabase(recipe) { [weak self] success, _ in
            guard let self = self else { return }
            self.finishWithResult(success: success)
        }
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

    private func fetchHTML(from url: URL, completion: @escaping (String?) -> Void) {
        var request = URLRequest(url: url)
        request.setValue("Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15", forHTTPHeaderField: "User-Agent")
        request.timeoutInterval = 10.0

        URLSession.shared.dataTask(with: request) { data, response, error in
            if error != nil {
                completion(nil)
                return
            }

            guard let data = data,
                  let html = String(data: data, encoding: .utf8) else {
                completion(nil)
                return
            }

            completion(html)
        }.resume()
    }

    // MARK: - API

    private func fetchRecipeFromAPI(html: String, url: String?) {
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.braise.recipe"),
              let apiURLString = sharedDefaults.string(forKey: "recipeImportAPIURL"),
              let apiURL = URL(string: apiURLString) else {
            finishWithResult(success: false)
            return
        }

        var request = URLRequest(url: apiURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.timeoutInterval = 30.0

        var requestBody: [String: Any] = ["html": html]
        if let urlString = url { requestBody["url"] = urlString }

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

    private func saveRecipeToSupabase(_ recipe: [String: Any], completion: @escaping (Bool, String?) -> Void) {
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.braise.recipe") else {
            completion(false, "Failed to access App Group")
            return
        }

        guard let supabaseURL = sharedDefaults.string(forKey: "supabaseURL"),
              let supabaseAnonKey = sharedDefaults.string(forKey: "supabaseAnonKey"),
              let accessToken = sharedDefaults.string(forKey: "supabaseAccessToken"),
              let userId = sharedDefaults.string(forKey: "supabaseUserId") else {
            completion(false, "Missing Supabase credentials - app needs to store them in App Group")
            return
        }

        var processedRecipe = recipe
        processedRecipe["user_id"] = userId

        guard let apiURL = URL(string: "\(supabaseURL)/rest/v1/recipes") else {
            completion(false, "Invalid Supabase URL")
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
            completion(false, "Failed to encode recipe")
            return
        }

        request.httpBody = jsonData

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(false, error.localizedDescription)
                return
            }

            guard let httpResponse = response as? HTTPURLResponse else {
                completion(false, "Invalid response")
                return
            }

            if (200..<300).contains(httpResponse.statusCode) {
                completion(true, nil)
            } else {
                let errorMessage: String
                if let data = data, let errorJSON = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let message = errorJSON["message"] as? String {
                    errorMessage = message
                } else if let data = data, let errorString = String(data: data, encoding: .utf8) {
                    errorMessage = errorString
                } else {
                    errorMessage = "HTTP \(httpResponse.statusCode)"
                }

                completion(false, errorMessage)
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
