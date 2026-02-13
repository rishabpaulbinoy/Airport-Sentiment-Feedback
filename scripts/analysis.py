import os
import psycopg2
from textblob import TextBlob
from dotenv import load_dotenv

# 1. SETUP: Look for .env in the parent directory
# This ensures it works even though the script is in the /scripts folder
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path)

def analyze_feedback():
    try:
        # 2. Connect to Database using Environment Variables
        conn = psycopg2.connect(
            dbname=os.getenv("DB_DATABASE"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT")
        )
        cur = conn.cursor()

        # 3. Fetch comments that don't have a sentiment label yet
        cur.execute("SELECT id, comments FROM airport_feedback WHERE sentiment_label IS NULL;")
        rows = cur.fetchall()

        if not rows:
            print("No new feedback to analyze.")
            return

        for row in rows:
            fb_id, comment = row[0], row[1]
            
            # If comment is empty, skip or mark as Neutral
            if not comment:
                sentiment_label = "Neutral"
                score = 0
            else:
                # 4. AI Sentiment Analysis
                analysis = TextBlob(comment)
                score = analysis.sentiment.polarity
                
                if score > 0.1:
                    sentiment_label = "Positive"
                elif score < -0.1:
                    sentiment_label = "Negative"
                else:
                    sentiment_label = "Neutral"

            # 5. Update the Database
            cur.execute(
                "UPDATE airport_feedback SET sentiment_label = %s, sentiment_score = %s WHERE id = %s",
                (sentiment_label, score, fb_id)
            )
            print(f"Processed ID {fb_id}: {sentiment_label} ({score})")

        conn.commit()
        cur.close()
        conn.close()
        print("✅ AI Analysis complete.")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    analyze_feedback()