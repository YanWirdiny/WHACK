We are working on the App Buddy. Buddy is an app that can detect your surrounding to give you  the main. nec on  around you. which is fully essential for impaired vision. 
We. are using  a video as input and  made. directly from the Buddy Mobile app This input will be.  feed to Gemini Live API to detect. object. detectiion with focus  on important items such  as car   cross walk etc etc. 
the  Gemini live API will then  output  object detect with   essential information for Impaired person  as json. of  object. 
Can you check if Gemini Live API can check the  relative distance of this  such as MiDaS. 
 Based on that we can have data of what is in the video. That will be used to a describe to the. impaired the video 

so I want to know   when builind that. what to consider   and how to right establish the  front end and backend 

TEST 1
Import Gemini AI api and test out what response it wil give to videos.
 - Set an   Prompt const improvedPrompt = `
You are assisting a visually impaired person navigate safely. 
Analyze this image and estimate distances using these precise categories:

CRITICAL ZONE (0-5 feet / 0-1.5 meters):
- Objects requiring immediate action
- Use: "IMMEDIATE - less than 2 steps away"

CAUTION ZONE (5-15 feet / 1.5-4.5 meters):
- Objects to be aware of soon
- Use: "VERY CLOSE - approximately X steps/car lengths"

AWARENESS ZONE (15-40 feet / 4.5-12 meters):
- Objects in the near environment
- Use: "NEARBY - across the street/room"

BACKGROUND (40+ feet / 12+ meters):
- Context information
- Use: "IN DISTANCE - down the street"

For each object, provide:
1. Distance category
2. Approximate measurement using familiar references
3. Time-based estimate if moving ("will reach you in 5 seconds")
4. Relative position (left, right, center, above, below)

Return JSON with this exact format:
{
  "objects": [
    {
      "name": "object type",
      "distance_category": "CRITICAL/CAUTION/AWARENESS/BACKGROUND",
      "distance_estimate": "specific estimate with reference",
      "position": "detailed position",
      "urgency": "critical/high/medium/low",
      "audio_description": "clear, concise verbal description"
    }
  ]
}
`;

