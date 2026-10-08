FairPoker Studio voices - recording kit
=======================================

What this does
  Records all 7,545 dealer and player lines (about 147,000 characters) with Azure AI Speech
  neural voices, the same voices Microsoft Edge reads aloud with, using real emotion styles
  (angry, sad, excited, shouting, whispering, cheerful, friendly, unfriendly) where the
  voice supports them. That fits inside the free tier (500,000 characters a month).

1. Make a free Speech resource (about 5 minutes)
   - Sign in at https://portal.azure.com (a free account is fine).
   - Create a resource > search "Speech" > Create.
   - Pricing tier: Free F0. Region: East US (eastus) is a safe pick; the script checks every voice exists there.
   - When it is created, open it > "Keys and Endpoint". Copy KEY 1 and the Location/Region.

2. Install Python and the Azure Speech SDK
   - Python 3.8 or newer (python.org, or it is already on your Mac).
   - In a terminal:   pip install azure-cognitiveservices-speech

3. Record (about 30-40 minutes on the free tier; it paces itself to stay under the limit)
   - In a terminal, go to this folder and run:
       python record_voices.py --key YOUR_KEY_1 --region eastus
   - Quick test first if you like (dealer only, about 20 files, 1-2 minutes):
       python record_voices.py --key YOUR_KEY_1 --region eastus --only D
   - If it stops for any reason, run the same command again; finished files are kept.

4. Send it back
   - Zip the "voices" folder it created (about 45 MB) and upload it in the chat.
   - It gets published next to the game, and Settings > Voices > Studio switches on.

Your key never leaves your computer and is not stored in the game or the voice files.
