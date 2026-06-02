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
                    self.processHTML(html: html, url: url)
                }
                return
            }

            guard let html = html else {
                self.completeRequest()
                return
            }

            self.processHTML(html: html, url: url)
        }
    }

    private func processHTML(html: String, url: String?) {
        if let jsonld = extractJsonLd(from: html),
           let recipeJSON = formatRecipeFromJsonLd(jsonld: jsonld, sourceURL: url) {
            saveAndFinish(recipeJSON)
            return
        }
        fetchRecipeFromAPI(html: html, url: url)
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

    // MARK: - JSON-LD Extraction

    private func extractJsonLd(from html: String) -> String? {
        let pattern = "<script[^>]*type=[\"']application/ld\\+json[\"'][^>]*>([\\s\\S]*?)</script>"
        guard let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive) else {
            return nil
        }

        let ns = html as NSString
        let matches = regex.matches(in: html, options: [], range: NSRange(location: 0, length: ns.length))

        for match in matches where match.numberOfRanges > 1 {
            let range = match.range(at: 1)
            let jsonString = ns.substring(with: range)
            if jsonString.contains("\"Recipe\"") || jsonString.contains("\"@type\":\"Recipe\"") {
                return jsonString
            }
        }

        return nil
    }

    // MARK: - Recipe Formatting

    private func formatRecipeFromJsonLd(jsonld: String, sourceURL: String?) -> [String: Any]? {
        guard let jsonData = jsonld.data(using: .utf8),
              let jsonAny = try? JSONSerialization.jsonObject(with: jsonData) else {
            return nil
        }

        guard let recipeObj = findRecipeObject(in: jsonAny) else {
            return nil
        }

        let originalURL = sourceURL ?? ""
        var hostURL = ""
        var hostName = ""

        if let urlString = sourceURL, let url = URL(string: urlString) {
            hostURL = "\(url.scheme ?? "")://\(url.host ?? "")"
            hostName = url.host ?? ""
        }

        let title = extractString("name", from: recipeObj)
        let author = extractAuthor(from: recipeObj)
        let categories = extractCategories(from: recipeObj, title: title)
        let image = extractImage(from: recipeObj)
        let ingredientsArray = extractStringArray("recipeIngredient", from: recipeObj)
        let ingredients = ingredientsArray
            .map { cleanIngredient($0) }
            .joined(separator: "\\n")
        let instructions = extractInstructions(from: recipeObj)
        let (totalTime, totalTimeUnit) = extractTime(from: recipeObj)
        let servings = extractServings(from: recipeObj)
        let about = extractString("description", from: recipeObj)

        let formatted: [String: Any] = [
            "title": title,
            "author": author,
            "original_url": originalURL,
            "host_url": hostURL,
            "host_name": hostName,
            "categories": categories,
            "image": image,
            "ingredients": ingredients,
            "instructions": instructions,
            "total_time": totalTime,
            "total_time_unit": totalTimeUnit,
            "servings": servings,
            "about": about
        ]

        return formatted
    }

    private func isRecipeType(_ obj: [String: Any]) -> Bool {
        if let type = obj["@type"] as? String { return type == "Recipe" }
        if let types = obj["@type"] as? [String] { return types.contains("Recipe") }
        return false
    }

    private func findRecipeObject(in jsonAny: Any) -> [String: Any]? {
        if let jsonArray = jsonAny as? [[String: Any]] {
            return jsonArray.first { isRecipeType($0) }
        } else if let jsonObject = jsonAny as? [String: Any] {
            if isRecipeType(jsonObject) {
                return jsonObject
            } else if let graph = jsonObject["@graph"] as? [[String: Any]] {
                return graph.first { isRecipeType($0) }
            } else if let items = jsonObject["itemListElement"] as? [[String: Any]] {
                for item in items {
                    if let itemObj = item["item"] as? [String: Any], isRecipeType(itemObj) {
                        return itemObj
                    }
                }
            }
        }
        return nil
    }

    private func extractAuthor(from recipeObj: [String: Any]) -> String {
        if let authorArray = recipeObj["author"] as? [[String: Any]], let firstAuthor = authorArray.first {
            return extractString("name", from: firstAuthor)
        } else if let authorObj = recipeObj["author"] as? [String: Any] {
            return extractString("name", from: authorObj)
        }
        return extractString("author", from: recipeObj)
    }

    private func extractCategories(from recipeObj: [String: Any], title: String) -> String {
        var categoriesArray = extractStringArray("recipeCategory", from: recipeObj)
            .map { $0.lowercased() }
            .filter { !$0.isEmpty }

        if categoriesArray.count < 2 {
            let cuisineArray = extractStringArray("recipeCuisine", from: recipeObj)
                .map { $0.lowercased() }
                .filter { !$0.isEmpty }
            for cuisine in cuisineArray where categoriesArray.count < 2 && !categoriesArray.contains(cuisine) {
                categoriesArray.append(cuisine)
            }
        }

        if categoriesArray.count < 2 {
            let keywordsStr = extractString("keywords", from: recipeObj)
            let keywords = keywordsStr.components(separatedBy: ",")
                .map { $0.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }
                .filter { !$0.isEmpty }
            for keyword in keywords where categoriesArray.count < 2 && !categoriesArray.contains(keyword) {
                categoriesArray.append(keyword)
            }
        }

        if categoriesArray.count < 2 && !title.isEmpty {
            let stopWords: Set<String> = ["delicious", "easy", "quick", "best", "homemade", "perfect", "simple", "amazing", "the", "a", "an", "and", "or", "with", "for", "in", "to", "of", "my", "dish", "bowl", "recipe", "meal", "food"]
            let titleWords = title.components(separatedBy: CharacterSet.alphanumerics.inverted)
                .map { $0.lowercased() }
                .filter { $0.count >= 3 && !stopWords.contains($0) }
            for word in titleWords where categoriesArray.count < 2 && !categoriesArray.contains(word) {
                categoriesArray.append(word)
            }
        }

        return categoriesArray.joined(separator: ",")
    }

    private func extractImage(from recipeObj: [String: Any]) -> String {
        if let imageObj = recipeObj["image"] as? [String: Any] {
            return extractString("url", from: imageObj)
        } else if let imageArray = recipeObj["image"] as? [String] {
            return imageArray.first ?? ""
        } else if let imageArray = recipeObj["image"] as? [[String: Any]] {
            return imageArray.first.flatMap { extractString("url", from: $0) } ?? ""
        }
        return extractString("image", from: recipeObj)
    }

    private func extractInstructions(from recipeObj: [String: Any]) -> String {
        let joined: String
        if let instructionsObj = recipeObj["recipeInstructions"] as? [[String: Any]] {
            let steps = instructionsObj.compactMap { obj -> String? in
                if let text = obj["text"] as? String {
                    return text
                } else if let text = obj["@value"] as? String {
                    return text
                } else if let text = obj["name"] as? String {
                    return text
                }
                return nil
            }
            joined = steps.joined(separator: "\\n")
        } else if let instructionsArray = recipeObj["recipeInstructions"] as? [String] {
            joined = instructionsArray.joined(separator: "\\n")
        } else if let instructionsString = recipeObj["recipeInstructions"] as? String {
            joined = instructionsString
        } else {
            return ""
        }
        return splitNumberedSteps(joined)
    }

    private static let stepSplitRegex = try? NSRegularExpression(
        pattern: #"(?<=[.!?])\s*(?=\d+\.\s)"#
    )

    private func splitNumberedSteps(_ text: String) -> String {
        guard !text.contains("\\n"), text.hasPrefix("1.") else { return text }
        guard let regex = Self.stepSplitRegex else { return text }
        let ns = text as NSString
        let matches = regex.matches(in: text, range: NSRange(location: 0, length: ns.length))
        guard !matches.isEmpty else { return text }
        var parts: [String] = []
        var lastEnd = 0
        for match in matches {
            let raw = ns.substring(with: NSRange(location: lastEnd, length: match.range.location - lastEnd))
                .trimmingCharacters(in: .whitespaces)
            let part = raw.replacingOccurrences(of: #"^\d+\.\s*"#, with: "", options: .regularExpression)
            if !part.isEmpty { parts.append(part) }
            lastEnd = match.range.location + match.range.length
        }
        let tail = ns.substring(from: lastEnd)
            .trimmingCharacters(in: .whitespaces)
            .replacingOccurrences(of: #"^\d+\.\s*"#, with: "", options: .regularExpression)
        if !tail.isEmpty { parts.append(tail) }
        return parts.count > 1 ? parts.joined(separator: "\\n") : text
    }

    private func extractTime(from recipeObj: [String: Any]) -> (String, String) {
        if let totalTimeObj = recipeObj["totalTime"] as? String {
            if let parsed = parseISO8601Duration(totalTimeObj) {
                return (String(parsed.minutes), parsed.unit)
            }
            if !totalTimeObj.hasPrefix("P") {
                let numbersOnly = totalTimeObj.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()
                if !numbersOnly.isEmpty {
                    let timeStr = totalTimeObj.uppercased()
                    let unit = (timeStr.contains("H") || timeStr.contains("HOUR")) ? "hr" : "min"
                    return (numbersOnly, unit)
                }
            }
        } else if let prepTime = recipeObj["prepTime"] as? String,
                  let cookTime = recipeObj["cookTime"] as? String {
            let prepMinutes = parseISO8601Duration(prepTime)?.minutes ?? 0
            let cookMinutes = parseISO8601Duration(cookTime)?.minutes ?? 0

            if prepMinutes > 0 || cookMinutes > 0 {
                let totalMinutes = prepMinutes + cookMinutes
                let unit = totalMinutes >= 60 ? "hr" : "min"
                return (String(totalMinutes), unit)
            } else {
                let numbersOnly = cookTime.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()
                if !numbersOnly.isEmpty {
                    let timeStr = cookTime.uppercased()
                    let unit = (timeStr.contains("H") || timeStr.contains("HOUR")) ? "hr" : "min"
                    return (numbersOnly, unit)
                }
            }
        }
        return ("", "")
    }

    private func extractServings(from recipeObj: [String: Any]) -> String {
        if let yield = recipeObj["recipeYield"] as? String {
            return extractFirstNumber(from: yield).map(String.init) ?? ""
        } else if let yield = recipeObj["recipeYield"] as? Int {
            return String(yield)
        } else if let yield = recipeObj["recipeYield"] as? Double {
            return String(Int(yield))
        } else if let yieldArray = recipeObj["recipeYield"] as? [Any], let first = yieldArray.first {
            if let num = first as? Int {
                return String(num)
            } else if let num = first as? Double {
                return String(Int(num))
            } else if let str = first as? String {
                return extractFirstNumber(from: str).map(String.init) ?? ""
            }
        }
        return ""
    }

    // MARK: - Parsing Helpers

    private static let ingredientNoteRegex = try? NSRegularExpression(
        pattern: #"\(,\s*((?:[^()]*|\([^()]*\))*)\)"#
    )

    private func cleanIngredient(_ ingredient: String) -> String {
        var result = ingredient
        if let regex = Self.ingredientNoteRegex {
            let ns = result as NSString
            result = regex.stringByReplacingMatches(
                in: result,
                range: NSRange(location: 0, length: ns.length),
                withTemplate: ", $1"
            )
        }
        result = result.replacingOccurrences(of: "((", with: "(")
        result = result.replacingOccurrences(of: "))", with: ")")
        return result
    }

    private func extractString(_ key: String, from dict: [String: Any]) -> String {
        if let value = dict[key] as? String {
            return value
        } else if let value = dict[key] as? [String] {
            return value.first ?? ""
        }
        return ""
    }

    private func extractStringArray(_ key: String, from dict: [String: Any]) -> [String] {
        if let value = dict[key] as? [String] {
            return value
        } else if let value = dict[key] as? String {
            return [value]
        } else if let value = dict[key] as? [[String: Any]] {
            return value.compactMap { $0["@value"] as? String ?? $0["name"] as? String }
        }
        return []
    }

    private func parseISO8601Duration(_ duration: String) -> (minutes: Int, unit: String)? {
        let pattern = "P(?:[0-9]+Y)?(?:[0-9]+M)?(?:[0-9]+D)?T(?:([0-9]+)H)?(?:([0-9]+)M)?(?:[0-9]+(?:\\.\\d+)?S)?"
        guard let regex = try? NSRegularExpression(pattern: pattern, options: []),
              let match = regex.firstMatch(in: duration, options: [], range: NSRange(location: 0, length: duration.count)) else {
            return nil
        }

        var hours = 0
        var minutes = 0

        if match.numberOfRanges > 1 {
            let hoursRange = match.range(at: 1)
            if hoursRange.location != NSNotFound {
                let hoursStr = (duration as NSString).substring(with: hoursRange)
                if let h = Int(hoursStr) {
                    hours = h
                }
            }
        }

        if match.numberOfRanges > 2 {
            let minutesRange = match.range(at: 2)
            if minutesRange.location != NSNotFound {
                let minutesStr = (duration as NSString).substring(with: minutesRange)
                if let m = Int(minutesStr) {
                    minutes = m
                }
            }
        }

        let totalMinutes = hours * 60 + minutes
        if totalMinutes > 0 {
            return (totalMinutes, "min")
        }
        return nil
    }

    private func extractFirstNumber(from string: String) -> Int? {
        let pattern = "(\\d+)"
        guard let regex = try? NSRegularExpression(pattern: pattern, options: []),
              let match = regex.firstMatch(in: string, options: [], range: NSRange(location: 0, length: string.count)),
              match.numberOfRanges > 1,
              let range = Range(match.range(at: 1), in: string),
              let number = Int(string[range]) else {
            return nil
        }
        return number
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

        let requestBody: [String: Any] = ["html": html]
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
                  var recipe = jsonAny as? [String: Any] else {
                self.finishWithResult(success: false)
                return
            }

            if let urlString = url {
                if recipe["original_url"] == nil {
                    recipe["original_url"] = urlString
                }
                if recipe["host_url"] == nil || recipe["host_name"] == nil,
                   let urlObj = URL(string: urlString) {
                    recipe["host_url"] = "\(urlObj.scheme ?? "")://\(urlObj.host ?? "")"
                    recipe["host_name"] = urlObj.host ?? ""
                }
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

        if let ingredients = processedRecipe["ingredients"] as? String {
            var processed = ingredients.replacingOccurrences(of: "\\n", with: "\n")
            if processed.hasSuffix("\n") {
                processed = String(processed.dropLast())
            }
            processedRecipe["ingredients"] = processed
        }
        if let instructions = processedRecipe["instructions"] as? String {
            var processed = instructions.replacingOccurrences(of: "\\n", with: "\n")
            if processed.hasSuffix("\n") {
                processed = String(processed.dropLast())
            }
            processedRecipe["instructions"] = processed
        }

        if let totalTimeStr = processedRecipe["total_time"] as? String, !totalTimeStr.isEmpty {
            processedRecipe["total_time"] = Int(totalTimeStr)
        } else {
            processedRecipe["total_time"] = nil
        }

        if let servingsStr = processedRecipe["servings"] as? String, !servingsStr.isEmpty {
            processedRecipe["servings"] = Int(servingsStr)
        } else {
            processedRecipe["servings"] = nil
        }

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
