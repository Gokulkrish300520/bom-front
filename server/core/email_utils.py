import os
import requests
import base64

def send_email_resend(to_email, subject, html_content, pdf_bytes=None, filename="document.pdf"):
    """
    Send email via Resend API with optional PDF attachment
    
    Args:
        to_email (str): Recipient email address
        subject (str): Email subject
        html_content (str): HTML body of the email
        pdf_bytes (bytes, optional): PDF file as bytes. Defaults to None.
        filename (str, optional): Name of the PDF file. Defaults to "document.pdf".
    
    Returns:
        dict: Response from Resend API
    """
    
    RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
    if not RESEND_API_KEY:
        raise Exception("RESEND_API_KEY not set in environment variables")

    # Build the base email payload
    email_payload = {
        "from": "Glonix Electronics <noreply@glonix.in>",
        "to": [to_email],
        "subject": subject,
        "html": html_content,
    }
    
    # Add PDF attachment if provided
    if pdf_bytes:
        # Encode PDF bytes to base64 string for Resend API
        pdf_base64_string = base64.b64encode(pdf_bytes).decode('utf-8')
        
        email_payload["attachments"] = [
            {
                "filename": filename,
                "content": pdf_base64_string
            }
        ]

    # Send email via Resend API
    response = requests.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
        json=email_payload,
    )

    if response.status_code != 200:
        raise Exception(f"Email failed: {response.text}")
    
    return response.json()