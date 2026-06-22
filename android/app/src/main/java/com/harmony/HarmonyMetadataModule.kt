package com.harmony

import android.media.MediaMetadataRetriever
import com.facebook.react.bridge.*

class HarmonyMetadataModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "HarmonyMetadata"

    @ReactMethod
    fun extractMetadata(filePath: String, promise: Promise) {
        val retriever = MediaMetadataRetriever()
        try {
            retriever.setDataSource(filePath)
            val title = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_TITLE)
            val artist = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ARTIST)
            val album = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ALBUM)
            val durationStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
            val duration = durationStr?.toLongOrNull() ?: 0L

            val map = Arguments.createMap().apply {
                putString("title", title)
                putString("artist", artist)
                putString("album", album)
                putDouble("durationMs", duration.toDouble())
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("METADATA_ERROR", "Failed to extract metadata: ${e.message}")
        } finally {
            try {
                retriever.release()
            } catch (e: Exception) {
                // Ignore release errors
            }
        }
    }
}
