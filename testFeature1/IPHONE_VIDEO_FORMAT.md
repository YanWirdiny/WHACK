# 📱 iPhone Video Format Guide

## iPhone Default Video Format

### **Format: MOV (QuickTime)**
iPhones record video in `.mov` format by default, NOT `.mp4`

## Video Recording Settings

### Location
**Settings → Camera → Formats**

### Two Options:

#### 1. **High Efficiency** (Default on newer iPhones)
- **Format**: `.mov`
- **Video Codec**: HEVC (H.265)
- **Benefits**:
  - 50% smaller file sizes
  - Better quality at same size
  - More efficient compression
- **Compatibility**: 
  - iPhone 7 and later
  - macOS High Sierra and later
  - May need conversion for older devices

#### 2. **Most Compatible**
- **Format**: `.mov`
- **Video Codec**: H.264
- **Benefits**:
  - Works on older devices
  - Wider compatibility
- **Trade-off**: Larger file sizes

## Technical Specs

| Setting | Container | Video Codec | Audio Codec |
|---------|-----------|-------------|-------------|
| High Efficiency | MOV | HEVC (H.265) | AAC |
| Most Compatible | MOV | H.264 | AAC |

## For Buddy App

### ✅ Updated Support
The app now accepts **both formats**:
- ✅ `.mp4` (MP4 files)
- ✅ `.mov` (iPhone recordings)

### MIME Types
- **MP4**: `video/mp4`
- **MOV**: `video/quicktime`

## Recording Resolutions

iPhones support various resolutions:
- **720p HD** at 30fps
- **1080p HD** at 30/60fps
- **4K** at 24/30/60fps (newer models)

### Recommended for Buddy App:
- **1080p at 30fps** - Good balance of quality and file size
- **720p at 30fps** - Smaller files, faster upload/processing

## File Sizes (Approximate)

### 10-second video clip:

| Resolution | H.264 | HEVC |
|------------|-------|------|
| 720p 30fps | ~15 MB | ~8 MB |
| 1080p 30fps | ~25 MB | ~12 MB |
| 4K 30fps | ~80 MB | ~40 MB |

### Recommendations:
- ✅ **5-10 seconds**: Optimal for quick analysis
- ✅ **Under 20 MB**: Fast upload
- ⚠️ **Avoid 4K**: Too large, slower processing

## Converting MOV to MP4 (If Needed)

### On Mac:
```bash
ffmpeg -i input.mov -c:v libx264 -c:a aac output.mp4
```

### On iPhone (using apps):
- **Video Compressor** app
- **Media Converter** app
- **Shortcuts** app (can automate conversion)

### Online Tools:
- CloudConvert.com
- Online-Convert.com

## Testing Your App with iPhone Videos

1. **Record test video** on iPhone
2. **AirDrop to Mac** or use **iCloud Photos**
3. **Place in** `testFeature1/test-videos/`
4. **Or** use the file picker in the app directly

## Gemini API Support

Gemini 2.0 Flash supports:
- ✅ `video/mp4`
- ✅ `video/quicktime` (MOV)
- ✅ `video/avi`
- ✅ `video/x-flv`
- ✅ `video/mpg`
- ✅ `video/webm`

So iPhone MOV files work perfectly!

## Common Issues

### "Unsupported format" error
- Check file extension is `.mov` or `.mp4`
- Verify MIME type detection in logs
- Ensure codec is H.264 or HEVC

### Large file upload fails
- Reduce video length to 5-10 seconds
- Use 720p instead of 4K
- Enable "Most Compatible" mode for smaller H.264 files

### Slow processing
- MOV files from iPhone can be large
- Consider video compression
- Use shorter clips

## Updated Code Changes

### 1. Document Picker (VideoAnalyzer.tsx)
```typescript
const result = await DocumentPicker.getDocumentAsync({
  type: ['video/mp4', 'video/quicktime'], // Now accepts both
  copyToCacheDirectory: true,
});
```

### 2. MIME Type Detection (geminiService.ts)
```typescript
// Auto-detect format from file extension
const isMov = videoUri.toLowerCase().endsWith('.mov');
const mimeType = isMov ? 'video/quicktime' : 'video/mp4';
```

### 3. Button Text Updated
```
Before: "Select Video (MP4)"
After:  "Select Video (MP4/MOV)"
```

## Best Practices for Buddy App

1. **Accept both formats** - Users shouldn't need to convert
2. **Auto-detect format** - No manual selection needed
3. **Show file info** - Display detected format in UI
4. **Compress if needed** - Optionally compress large files
5. **Test with iPhone** - Use real iPhone recordings

## Summary

✅ **iPhones use MOV format**, not MP4  
✅ **Both formats now supported** in Buddy app  
✅ **Auto-detection** handles format automatically  
✅ **Gemini API supports both** formats natively  
✅ **No conversion needed** for testing  

Your app is now fully compatible with iPhone video recordings! 🎥
