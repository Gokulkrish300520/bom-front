import { fetchWithAuth } from "@/auth/tokenservice";

type DocumentData = {
  document_number: string;
  [key: string]: any;
};

export async function generateAndDownloadDocument(
  documentType: string,
  documentData: DocumentData
) {
  try {
    const response = await fetchWithAuth('http://web-production-6baf3.up.railway.app/api/api/generate-pdf/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document_type: documentType,
        document_data: documentData,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentType}_${documentData.document_number}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    console.log("PDF downloaded successfully!");
  } catch (error) {
    console.error("Failed to download PDF:", error);
  }
}
