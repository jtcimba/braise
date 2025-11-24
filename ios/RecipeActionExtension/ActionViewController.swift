import UIKit
import MobileCoreServices
import UniformTypeIdentifiers

class ActionViewController: UIViewController {

    @IBOutlet weak var statusLabel: UILabel!
    @IBOutlet weak var activityIndicator: UIActivityIndicatorView!
    @IBOutlet weak var imageView: UIImageView!
  
    override func viewDidLoad() {
        super.viewDidLoad()
        print("🍳 Action Extension Loaded")
        handleIncomingData()
    }

    // MARK: - Handle incoming data from Action.js
    private func handleIncomingData() {
        guard let inputItems = extensionContext?.inputItems as? [NSExtensionItem] else {
            handleUserFacingFailure()
            return
        }

      for item in inputItems {
          guard let attachments = item.attachments else { continue }

        for provider in attachments {
            let identifiers = provider.registeredTypeIdentifiers
            print("📎 Provider identifiers:", identifiers)

            if identifiers.contains("com.apple.property-list") {
                print("✅ Found property-list provider")
                provider.loadItem(forTypeIdentifier: "com.apple.property-list", options: nil) { (item, error) in
                    if let error = error {
                        print("❌ loadItem error:", error)
                        self.handleUserFacingFailure()
                        return
                    }
                    guard let dict = item as? NSDictionary else {
                        print("⚠️ No valid dictionary from JS")
                        self.handleUserFacingFailure()
                        return
                    }
                    if let results = dict["NSExtensionJavaScriptPreprocessingResultsKey"] as? NSDictionary {
                        let html = results["html"] as? String ?? ""
                        let url = results["url"] as? String ?? ""
                        let title = results["title"] as? String ?? ""
                        let jsonLd = results["jsonLd"] as? [String] ?? []
                        let textLength = results["text_length"] as? Int ?? 0
                        print("✅ HTML length:", html.count)
                        print("✅ URL:", url)
                        print("✅ Title:", title)
                        print("✅ JSON-LD length:", jsonLd.count)
                        print("✅ Text length:", textLength)
                        
                        // Call your backend
                        self.sendToBackend(html: html, url: url, title: title, jsonLd: jsonLd, textLength: textLength)
                    } else {
                        print("❌ Failed to find NSExtensionJavaScriptPreprocessingResultsKey")
                        self.handleUserFacingFailure()
                    }
                }
            } else {
                print("⚠️ Unknown provider types:", identifiers)
                self.handleUserFacingFailure()
            }
        }
      }
    }

  // MARK: - Send to backend
  private func sendToBackend(html: String, url: String, title: String, jsonLd: [String], textLength: Int) {
      print("📤 Sending to Lambda…")
      guard let endpoint = URL(string: "https://i1ylo3n8sl.execute-api.us-east-1.amazonaws.com/prod/recipes/import-recipe-from-browser") else {
          handleUserFacingFailure()
          return
      }

      var request = URLRequest(url: endpoint)
      request.httpMethod = "POST"
      request.setValue("application/json", forHTTPHeaderField: "Content-Type")

      let payload: [String: Any] = [
          "html": html,
          "url": url,
          "title": title,
          "jsonLd": jsonLd.joined(separator: "\n"),
          "text_length": textLength
      ]

      do {
          request.httpBody = try JSONSerialization.data(withJSONObject: payload)
      } catch {
          handleUserFacingFailure()
          return
      }

      print("📤 Sending recipe to backend:", url)

      let task = URLSession.shared.dataTask(with: request) { data, response, error in
          DispatchQueue.main.async {
              if let error = error {
                  print("❌ Network error:", error)
                  self.handleUserFacingFailure()
                  return
              }

              guard let httpResp = response as? HTTPURLResponse else {
                  self.handleUserFacingFailure()
                  return
              }

              guard let data = data else {
                  self.handleUserFacingFailure()
                  return
              }

              print("✅ Server response:", httpResp.statusCode)

              if httpResp.statusCode == 200 {
                  // Try to parse JSON from Lambda response
                  do {
                      if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] {
                          // Prefer the recipe field if present
                          let recipeJSON = json["recipe"] ?? json
                          let recipeData = try JSONSerialization.data(withJSONObject: recipeJSON)
                          let recipeString = String(data: recipeData, encoding: .utf8) ?? "{}"
                          let encoded = recipeString.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""

                          // Construct deep link to open Braise app
                          if let deepLink = URL(string: "braise://import?data=\(encoded)") {
                            print("🔗 Opening app with deep link: \(deepLink)")
                            var responder: UIResponder? = self
                            while let r = responder {
                                if let app = r as? UIApplication {
                                    app.open(deepLink)
                                    break
                                }
                                responder = r.next
                            }
                          } else {
                            self.updateStatus("Error creating deep link")
                          }
                      } else {
                          self.handleUserFacingFailure()
                      }
                  } catch {
                      print("❌ Error parsing JSON:", error)
                      self.handleUserFacingFailure()
                  }
              } else {
                  print("❌ Server response:", httpResp)
                  self.handleUserFacingFailure()
              }

              self.dismissAfterDelay()
          }
      }

      task.resume()
  }

    // MARK: - UI Updates
    private func updateStatus(_ message: String) {
        statusLabel.text = message
        statusLabel.textColor = .label
    }

    private func dismissAfterDelay(_ seconds: TimeInterval = 1.5) {
        DispatchQueue.main.asyncAfter(deadline: .now() + seconds) {
            self.extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
        }
    }

    private func handleUserFacingFailure() {
        DispatchQueue.main.async {
            self.activityIndicator.stopAnimating()
            self.updateStatus("Something went wrong.\nPlease try importing again.")
            self.dismissAfterDelay()
        }
    }

    // MARK: - Deep Link to main app
    private func openMainApp(with url: String) {
        guard let encoded = url.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
              let deepLink = URL(string: "braise://import?url=\(encoded)") else {
            print("⚠️ Invalid deep link")
            return
        }

        var responder: UIResponder? = self
        while let r = responder {
            if let app = r as? UIApplication {
                app.open(deepLink)
                break
            }
            responder = r.next
        }
    }
}
