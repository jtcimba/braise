import UIKit
import MobileCoreServices

class ShareViewController: UIViewController {
    
    private var hasProcessed = false
    private var activityIndicator: UIActivityIndicatorView?
    private var successView: UIView?
    private var isCompleting = false
    
    override init(nibName nibNameOrNil: String?, bundle nibBundleOrNil: Bundle?) {
        super.init(nibName: nibNameOrNil, bundle: nibBundleOrNil)
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
    }
    
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
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
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
    
    func processShare() {
        guard let extensionContext = extensionContext else {
            completeRequest()
            return
        }
        
        guard let item = extensionContext.inputItems.first as? NSExtensionItem else {
            completeRequest()
            return
        }
        
        guard let attachments = item.attachments, !attachments.isEmpty else {
            completeRequest()
            return
        }
        
        extractHTML(from: attachments) { [weak self] html, url in
            guard let self = self else { return }
            
            if html == nil, let urlString = url, let fetchURL = URL(string: urlString) {
                self.fetchHTML(from: fetchURL) { [weak self] fetchedHTML in
                    guard let self = self else { return }
                    guard let html = fetchedHTML else {
                        self.showFailureAnimation {
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                                self.completeRequest()
                            }
                        }
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
    
    func processHTML(html: String, url: String?) {
        guard let jsonld = extractJsonLd(from: html) else {
            fetchRecipeFromAPI(html: html, url: url)
            return
        }
        
        guard let recipeJSON = formatRecipeFromJsonLd(jsonld: jsonld, sourceURL: url) else {
            showFailureAnimation {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    self.completeRequest()
                }
            }
            return
        }
        
        saveRecipeToSupabase(recipeJSON) { [weak self] success, error in
            guard let self = self else { return }
            
            if success {
                self.showSuccessAnimation {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        self.completeRequest()
                    }
                }
            } else {
                self.showFailureAnimation {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        self.completeRequest()
                    }
                }
            }
        }
    }
    
    func fetchRecipeFromAPI(html: String, url: String?) {
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.braise.recipe"),
              let apiURLString = sharedDefaults.string(forKey: "recipeImportAPIURL"),
              let apiURL = URL(string: apiURLString) else {
            showFailureAnimation {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    self.completeRequest()
                }
            }
            return
        }
        
        var request = URLRequest(url: apiURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.timeoutInterval = 30.0
        
        let requestBody: [String: Any] = ["html": html]
        guard let jsonData = try? JSONSerialization.data(withJSONObject: requestBody) else {
            showFailureAnimation {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    self.completeRequest()
                }
            }
            return
        }
        
        request.httpBody = jsonData
        
        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self else { return }
            
            if let error = error {
                self.showFailureAnimation {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        self.completeRequest()
                    }
                }
                return
            }
            
            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode >= 200 && httpResponse.statusCode < 300,
                  let data = data,
                  let jsonAny = try? JSONSerialization.jsonObject(with: data) else {
                self.showFailureAnimation {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        self.completeRequest()
                    }
                }
                return
            }
                
            guard let recipe = jsonAny as? [String: Any] else {
                self.showFailureAnimation {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        self.completeRequest()
                    }
                }
                return
            }
            
            var recipeWithURL = recipe
            if let urlString = url {
                if recipeWithURL["original_url"] == nil {
                    recipeWithURL["original_url"] = urlString
                }
                if recipeWithURL["host_url"] == nil || recipeWithURL["host_name"] == nil,
                   let urlObj = URL(string: urlString) {
                    recipeWithURL["host_url"] = "\(urlObj.scheme ?? "")://\(urlObj.host ?? "")"
                    recipeWithURL["host_name"] = urlObj.host ?? ""
                }
            }
            
            self.saveRecipeToSupabase(recipeWithURL) { [weak self] success, error in
                guard let self = self else { return }
                
                if success {
                    self.showSuccessAnimation {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                            self.completeRequest()
                        }
                    }
                } else {
                    self.showFailureAnimation {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                            self.completeRequest()
                        }
                    }
                }
            }
        }.resume()
    }
    
    func extractHTML(from attachments: [NSItemProvider], completion: @escaping (String?, String?) -> Void) {
        let group = DispatchGroup()
        var foundHTML: String?
        var foundURL: String?
        var hasEnteredGroup = false
        
        for (index, provider) in attachments.enumerated() {
            let types = provider.registeredTypeIdentifiers
            
            if provider.hasItemConformingToTypeIdentifier("public.url") {
                hasEnteredGroup = true
                group.enter()
                provider.loadItem(forTypeIdentifier: "public.url", options: nil) { item, error in
                    defer { group.leave() }
                    if let error = error {
                    } else if let url = item as? URL {
                        foundURL = url.absoluteString
                    }
                }
            }
            
            if provider.hasItemConformingToTypeIdentifier("public.html") {
                hasEnteredGroup = true
                group.enter()
                provider.loadItem(forTypeIdentifier: "public.html", options: nil) { item, error in
                    defer { group.leave() }
                    if let error = error {
                    } else {
                        if let html = item as? String {
                            foundHTML = html
                        } else if let data = item as? Data, let html = String(data: data, encoding: .utf8) {
                            foundHTML = html
                        } else if let url = item as? URL {
                            if let data = try? Data(contentsOf: url), let html = String(data: data, encoding: .utf8) {
                                foundHTML = html
                            }
                        } else {
                        }
                    }
                }
            }
            
            if provider.hasItemConformingToTypeIdentifier(kUTTypeURL as String) {
                hasEnteredGroup = true
                group.enter()
                provider.loadItem(forTypeIdentifier: kUTTypeURL as String, options: nil) { item, error in
                    defer { group.leave() }
                    if let error = error {
                    } else if let url = item as? URL {
                        foundURL = url.absoluteString
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
    
    func fetchHTML(from url: URL, completion: @escaping (String?) -> Void) {
        var request = URLRequest(url: url)
        request.setValue("Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15", forHTTPHeaderField: "User-Agent")
        request.timeoutInterval = 10.0
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
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
    
    func extractJsonLd(from html: String) -> String? {
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
    
    func formatRecipeFromJsonLd(jsonld: String, sourceURL: String?) -> [String: Any]? {
        guard let jsonData = jsonld.data(using: .utf8),
              let jsonAny = try? JSONSerialization.jsonObject(with: jsonData) else {
            return nil
        }
        
        var recipe: [String: Any]?
        
        if let jsonArray = jsonAny as? [[String: Any]] {
            recipe = jsonArray.first { ($0["@type"] as? String) == "Recipe" }
        } else if let jsonObject = jsonAny as? [String: Any] {
            if let type = jsonObject["@type"] as? String, type == "Recipe" {
                recipe = jsonObject
            } else if let graph = jsonObject["@graph"] as? [[String: Any]] {
                recipe = graph.first { ($0["@type"] as? String) == "Recipe" }
            } else if let items = jsonObject["itemListElement"] as? [[String: Any]] {
                for item in items {
                    if let itemObj = item["item"] as? [String: Any],
                       let type = itemObj["@type"] as? String, type == "Recipe" {
                        recipe = itemObj
                        break
                    }
                }
            }
        }
        
        guard let recipeObj = recipe else {
            return nil
        }
        
        let originalURL = sourceURL ?? ""
        var hostURL = ""
        var hostName = ""
        
        if let urlString = sourceURL, let url = URL(string: urlString) {
            hostURL = "\(url.scheme ?? "")://\(url.host ?? "")"
            hostName = url.host ?? ""
        }
        
        func extractString(_ key: String, from dict: [String: Any]) -> String {
            if let value = dict[key] as? String {
                return value
            } else if let value = dict[key] as? [String] {
                return value.first ?? ""
            }
            return ""
        }
        
        func extractStringArray(_ key: String, from dict: [String: Any]) -> [String] {
            if let value = dict[key] as? [String] {
                return value
            } else if let value = dict[key] as? String {
                return [value]
            } else if let value = dict[key] as? [[String: Any]] {
                return value.compactMap { $0["@value"] as? String ?? $0["name"] as? String }
            }
            return []
        }
        
        let title = extractString("name", from: recipeObj)
        
        let author: String
        if let authorArray = recipeObj["author"] as? [[String: Any]], let firstAuthor = authorArray.first {
            author = extractString("name", from: firstAuthor)
        } else if let authorObj = recipeObj["author"] as? [String: Any] {
            author = extractString("name", from: authorObj)
        } else {
            author = extractString("author", from: recipeObj)
        }
        
        let categoriesArray = extractStringArray("recipeCategory", from: recipeObj)
        let categories = categoriesArray.map { $0.lowercased() }.joined(separator: ",")
        
        let image: String
        if let imageObj = recipeObj["image"] as? [String: Any] {
            image = extractString("url", from: imageObj)
        } else if let imageArray = recipeObj["image"] as? [String] {
            image = imageArray.first ?? ""
        } else if let imageArray = recipeObj["image"] as? [[String: Any]] {
            image = imageArray.first.flatMap { extractString("url", from: $0) } ?? ""
        } else {
            image = extractString("image", from: recipeObj)
        }
        
        let ingredientsArray = extractStringArray("recipeIngredient", from: recipeObj)
        let ingredients = ingredientsArray.joined(separator: "\\n")
        
        var instructions = ""
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
            instructions = steps.joined(separator: "\\n")
        } else if let instructionsArray = recipeObj["recipeInstructions"] as? [String] {
            instructions = instructionsArray.joined(separator: "\\n")
        } else if let instructionsString = recipeObj["recipeInstructions"] as? String {
            instructions = instructionsString
        }
        
        var totalTime = ""
        var totalTimeUnit = ""
        
        func parseISO8601Duration(_ duration: String) -> (minutes: Int, unit: String)? {
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
        
        if let totalTimeObj = recipeObj["totalTime"] as? String {
            if let parsed = parseISO8601Duration(totalTimeObj) {
                totalTime = String(parsed.minutes)
                totalTimeUnit = parsed.unit
            } else {
                if !totalTimeObj.hasPrefix("P") {
                    let numbersOnly = totalTimeObj.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()
                    if !numbersOnly.isEmpty {
                        totalTime = numbersOnly
                        let timeStr = totalTimeObj.uppercased()
                        if timeStr.contains("H") || timeStr.contains("HOUR") {
                            totalTimeUnit = "hr"
                        } else {
                            totalTimeUnit = "min"
                        }
                    }
                }
            }
        } else if let prepTime = recipeObj["prepTime"] as? String,
                  let cookTime = recipeObj["cookTime"] as? String {
            var prepMinutes = 0
            var cookMinutes = 0
            
            if let prep = parseISO8601Duration(prepTime) {
                prepMinutes = prep.minutes
            }
            if let cook = parseISO8601Duration(cookTime) {
                cookMinutes = cook.minutes
            }
            
            if prepMinutes > 0 || cookMinutes > 0 {
                let totalMinutes = prepMinutes + cookMinutes
                totalTime = String(totalMinutes)
                totalTimeUnit = totalMinutes >= 60 ? "hr" : "min"
            } else {
                let numbersOnly = cookTime.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()
                if !numbersOnly.isEmpty {
                    totalTime = numbersOnly
                    let timeStr = cookTime.uppercased()
                    if timeStr.contains("H") || timeStr.contains("HOUR") {
                        totalTimeUnit = "hr"
                    } else {
                        totalTimeUnit = "min"
                    }
                }
            }
        }
        
        let servings: String
        if let yield = recipeObj["recipeYield"] as? String {
            let numberPattern = "(\\d+)"
            if let regex = try? NSRegularExpression(pattern: numberPattern, options: []),
               let match = regex.firstMatch(in: yield, options: [], range: NSRange(location: 0, length: yield.count)),
               match.numberOfRanges > 1,
               let range = Range(match.range(at: 1), in: yield),
               let number = Int(yield[range]) {
                servings = String(number)
            } else {
                servings = ""
            }
        } else if let yield = recipeObj["recipeYield"] as? Int {
            servings = String(yield)
        } else if let yield = recipeObj["recipeYield"] as? Double {
            servings = String(Int(yield))
        } else if let yieldArray = recipeObj["recipeYield"] as? [Any], let first = yieldArray.first {
            if let num = first as? Int {
                servings = String(num)
            } else if let num = first as? Double {
                servings = String(Int(num))
            } else if let str = first as? String {
                let numberPattern = "(\\d+)"
                if let regex = try? NSRegularExpression(pattern: numberPattern, options: []),
                   let match = regex.firstMatch(in: str, options: [], range: NSRange(location: 0, length: str.count)),
                   match.numberOfRanges > 1,
                   let range = Range(match.range(at: 1), in: str),
                   let number = Int(str[range]) {
                    servings = String(number)
                } else {
                    servings = ""
                }
            } else {
                servings = ""
            }
        } else {
            servings = ""
        }
        
        let about = extractString("description", from: recipeObj)
        
        var formatted: [String: Any] = [
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
    
    func saveRecipeToSupabase(_ recipe: [String: Any], completion: @escaping (Bool, String?) -> Void) {
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
        
        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self else { return }
            
            if let error = error {
                completion(false, error.localizedDescription)
                return
            }
            
            guard let httpResponse = response as? HTTPURLResponse else {
                completion(false, "Invalid response")
                return
            }
            
            if httpResponse.statusCode >= 200 && httpResponse.statusCode < 300 {
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
    
    func showFailureAnimation(completion: @escaping () -> Void) {
        
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
            
            let xImageView = UIImageView()
            xImageView.translatesAutoresizingMaskIntoConstraints = false
            if #available(iOS 13.0, *) {
                let config = UIImage.SymbolConfiguration(pointSize: 60, weight: .medium, scale: .large)
                xImageView.image = UIImage(systemName: "xmark.circle.fill", withConfiguration: config)
            } else {
                xImageView.image = UIImage(systemName: "xmark.circle.fill")
            }
            xImageView.tintColor = .black
            xImageView.contentMode = .scaleAspectFit
            containerView.addSubview(xImageView)
            
            let label = UILabel()
            label.translatesAutoresizingMaskIntoConstraints = false
            label.text = "Failed to add recipe"
            label.font = UIFont.systemFont(ofSize: 20, weight: .semibold)
            label.textColor = .label
            label.textAlignment = .center
            containerView.addSubview(label)
            
            NSLayoutConstraint.activate([
                xImageView.topAnchor.constraint(equalTo: containerView.topAnchor),
                xImageView.centerXAnchor.constraint(equalTo: containerView.centerXAnchor),
                xImageView.widthAnchor.constraint(equalToConstant: 80),
                xImageView.heightAnchor.constraint(equalToConstant: 80),
                
                label.topAnchor.constraint(equalTo: xImageView.bottomAnchor, constant: 16),
                label.centerXAnchor.constraint(equalTo: containerView.centerXAnchor),
                label.bottomAnchor.constraint(equalTo: containerView.bottomAnchor)
            ])
            
            // Animate X icon appearance with scale
            xImageView.transform = CGAffineTransform(scaleX: 0.1, y: 0.1)
            
            UIView.animate(withDuration: 0.3, delay: 0, usingSpringWithDamping: 0.6, initialSpringVelocity: 0.5, options: [], animations: {
                containerView.alpha = 1.0
                xImageView.transform = CGAffineTransform(scaleX: 1.0, y: 1.0)
            }) { _ in
                UIView.animate(withDuration: 0.2, animations: {
                    xImageView.transform = CGAffineTransform(scaleX: 0.95, y: 0.95)
                }) { _ in
                    UIView.animate(withDuration: 0.2) {
                        xImageView.transform = .identity
                    }
                    completion()
                }
            }
        }
    }
    
    func showSuccessAnimation(completion: @escaping () -> Void) {
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
            
            let checkmarkImageView = UIImageView()
            checkmarkImageView.translatesAutoresizingMaskIntoConstraints = false
            if #available(iOS 13.0, *) {
                let config = UIImage.SymbolConfiguration(pointSize: 60, weight: .medium, scale: .large)
                checkmarkImageView.image = UIImage(systemName: "checkmark.circle.fill", withConfiguration: config)
            } else {
                checkmarkImageView.image = UIImage(systemName: "checkmark.circle.fill")
            }
            checkmarkImageView.tintColor = .black
            checkmarkImageView.contentMode = .scaleAspectFit
            containerView.addSubview(checkmarkImageView)
            
            let label = UILabel()
            label.translatesAutoresizingMaskIntoConstraints = false
            label.text = "Recipe Saved"
            label.font = UIFont.systemFont(ofSize: 20, weight: .semibold)
            label.textColor = .label
            label.textAlignment = .center
            containerView.addSubview(label)
            
            NSLayoutConstraint.activate([
                checkmarkImageView.topAnchor.constraint(equalTo: containerView.topAnchor),
                checkmarkImageView.centerXAnchor.constraint(equalTo: containerView.centerXAnchor),
                checkmarkImageView.widthAnchor.constraint(equalToConstant: 80),
                checkmarkImageView.heightAnchor.constraint(equalToConstant: 80),
                
                label.topAnchor.constraint(equalTo: checkmarkImageView.bottomAnchor, constant: 16),
                label.centerXAnchor.constraint(equalTo: containerView.centerXAnchor),
                label.bottomAnchor.constraint(equalTo: containerView.bottomAnchor)
            ])
            
            self.successView = containerView
            
            checkmarkImageView.transform = CGAffineTransform(scaleX: 0.1, y: 0.1)
            
            UIView.animate(withDuration: 0.3, delay: 0, usingSpringWithDamping: 0.6, initialSpringVelocity: 0.5, options: [], animations: {
                containerView.alpha = 1.0
                checkmarkImageView.transform = CGAffineTransform(scaleX: 1.0, y: 1.0)
            }) { _ in
                UIView.animate(withDuration: 0.2, animations: {
                    checkmarkImageView.transform = CGAffineTransform(scaleX: 0.95, y: 0.95)
                }) { _ in
                    UIView.animate(withDuration: 0.2) {
                        checkmarkImageView.transform = .identity
                    }
                    completion()
                }
            }
        }
    }
    
    func completeRequest() {
        activityIndicator?.stopAnimating()
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let context = self.extensionContext else { return }
            context.completeRequest(returningItems: nil, completionHandler: nil)
        }
    }
}
