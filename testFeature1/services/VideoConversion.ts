
/**
 * Note: There's no way to remove audio from MOV files in pure JavaScript/React Native
 * without native modules. Options are:
 * 
 * 1. Use FFmpeg (requires development build)
 * 2. Use cloud service like CloudConvert
 * 3. Tell Gemini to ignore audio in the prompt
 * 4. Send video as-is (Gemini supports MOV with audio)
 * 
 * Current approach: Send video as-is to Gemini
 */

/**
 * Process video before Gemini analysis
 * Currently just returns the original video URI
 */
export async function convertAndCompressToMp4(videoUri: string): Promise<string> {
  console.log('🎥 Processing video for Gemini analysis...');
  
  const isMov = videoUri.toLowerCase().endsWith('.mov') || videoUri.includes('.mov?');
  
  if (isMov) {
    console.log('📹 MOV format detected');
    console.log('⚠️  Note: Audio cannot be removed without native modules');
    console.log('✅ Sending MOV file to Gemini (with audio)');
  } else {
    console.log('✅ MP4 format detected - sending as-is');
  }
  
  return videoUri;
}
