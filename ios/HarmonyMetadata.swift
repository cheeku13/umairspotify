import Foundation
import AVFoundation

@objc(HarmonyMetadata)
class HarmonyMetadata: NSObject {

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc
  func extractMetadata(_ filePath: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let fileUrl = URL(fileURLWithPath: filePath)
    let asset = AVAsset(url: fileUrl)
    
    var metadata: [String: Any] = [:]
    metadata["durationMs"] = CMTimeGetSeconds(asset.duration) * 1000
    
    for item in asset.commonMetadata {
      if let key = item.commonKey?.rawValue, let value = item.stringValue {
        metadata[key] = value
      }
    }
    
    resolve(metadata)
  }
}
