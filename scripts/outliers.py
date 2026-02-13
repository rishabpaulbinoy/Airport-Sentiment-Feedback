import pandas as pd
import psycopg2
import os
from dotenv import load_dotenv

# 1. SETUP: Look for .env in the parent directory
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path)

def detect_outliers_with_gap_logic():
    try:
        # 2. Connect to Database using Environment Variables
        conn = psycopg2.connect(
            dbname=os.getenv("DB_DATABASE"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT")
        )
        
        # 3. Load data
        query = "SELECT id, name, rating, sentiment_score, comments FROM airport_feedback"
        df = pd.read_sql(query, conn)

        if df.empty:
            print("No data found.")
            return

        # 4. Normalize Rating (convert 1-5 scale to -1.0 to 1.0 scale)
        df['norm_rating'] = ((df['rating'] - 1) / 4) * 2 - 1

        # 5. Calculate the Gap
        df['gap'] = (df['norm_rating'] - df['sentiment_score']).abs()

        # 6. Set Threshold
        threshold = 1.0
        df['is_outlier'] = df['gap'] > threshold

        # 7. Update Database
        cur = conn.cursor()
        print(f"🔍 Analyzing {len(df)} records for contradictions...")
        
        outlier_count = 0
        for _, row in df.iterrows():
            cur.execute(
                "UPDATE airport_feedback SET is_outlier = %s WHERE id = %s",
                (bool(row['is_outlier']), int(row['id']))
            )
            if row['is_outlier']:
                outlier_count += 1
                print(f"🚩 FLAG: {row['name']} | Gap: {row['gap']:.2f} | Comment: {row['comments'][:30]}...")

        conn.commit()
        print(f"\n✅ Done! Found {outlier_count} true outliers.")
        
        cur.close()
        conn.close()

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    detect_outliers_with_gap_logic()