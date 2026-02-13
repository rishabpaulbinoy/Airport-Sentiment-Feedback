import os
import psycopg2
import smtplib
from dotenv import load_dotenv

# --- ROBUST PATH LOGIC ---
basedir = os.path.abspath(os.path.dirname(__file__))
dotenv_path = os.path.join(basedir, "..", ".env")
load_dotenv(dotenv_path)

def process_feedback_emails():
    # 1. Connect to PostgreSQL
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            database=os.getenv("DB_DATABASE"), 
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            port=os.getenv("DB_PORT")
        )
        print(f"✅ Connected to database: {os.getenv('DB_DATABASE') or 'postgres'}")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return

    cur = conn.cursor()

    # --- SCHEMA DISCOVERY BLOCK ---
    print("🔍 Searching for airport_feedback table...")
    cur.execute("""
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_name ILIKE '%airport%';
    """)
    found_tables = cur.fetchall()
    
    if not found_tables:
        print("❌ CRITICAL: No tables containing 'airport' found in this database!")
        print("Check if you created the table in 'airport_db' but are connecting to 'postgres'.")
        return
    else:
        for schema, name in found_tables:
            print(f"📍 Found table: {schema}.{name}")

    # 2. Fetch rows (Using flexible schema detection)
    target_table = f"{found_tables[0][0]}.{found_tables[0][1]}"
    print(f"🚀 Attempting query on: {target_table}")
    
    try:
        cur.execute(f"SELECT id, name, email, category, rating, comments FROM {target_table} WHERE email_sent = FALSE;")
        rows = cur.fetchall()
    except Exception as e:
        print(f"❌ SQL Error during fetch: {e}")
        cur.close()
        conn.close()
        return

    if not rows:
        print("No new feedback to process.")
        cur.close()
        conn.close()
        return

    # 3. Setup Email Server
    try:
        server = smtplib.SMTP(os.getenv('SMTP_SERVER'), os.getenv('SMTP_PORT'))
        server.starttls()
        server.login(os.getenv('SENDER_EMAIL'), os.getenv('SENDER_PASSWORD'))
    except Exception as e:
        print(f"❌ Email Server Login failed: {e}")
        cur.close()
        conn.close()
        return

    for row in rows:
        db_id, name, p_email, category, rating, comment = row
        
        if rating < 3:
            p_subject = "We're sorry: Let us make it right"
            p_body = (f"Dear {name},\n\nWe noticed you weren't satisfied with the {category}... "
                      f"Safe travels.")
            
            # Internal alert
            s_subject = f"ACTION REQUIRED: {category} Issue"
            s_body = f"Staff Alert!\nPassenger: {name}\nRating: {rating}\nComment: {comment}"
            server.sendmail(os.getenv('SENDER_EMAIL'), os.getenv('RECEIVER_EMAIL'), f"Subject: {s_subject}\n\n{s_body}")
        else:
            p_subject = "A quick thank you!"
            p_body = f"Hi {name}!\n\nThanks for the {rating}-star feedback on our {category}!"

        try:
            server.sendmail(os.getenv('SENDER_EMAIL'), p_email, f"Subject: {p_subject}\n\n{p_body}")
            cur.execute(f"UPDATE {target_table} SET email_sent = TRUE WHERE id = %s", (db_id,))
            conn.commit() 
            print(f"Email sent successfully to {name}")
        except Exception as e:
            print(f"Failed to send email to {name}: {e}")

    server.quit()
    cur.close()
    conn.close()
    print(f"Successfully processed {len(rows)} entries.")

if __name__ == "__main__":
    process_feedback_emails()