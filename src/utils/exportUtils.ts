
import type { FAQItem, ExportMetadata } from "@/types/faq";

export const exportToCSV = (faqs: FAQItem[], sourceUrl: string) => {
  const headers = [
    'Question',
    'Answer', 
    'Category',
    'Source URL',
    'Confidence',
    'Is Incomplete',
    'Is Duplicate',
    'Extracted At'
  ];

  const csvContent = [
    headers.join(','),
    ...faqs.map(faq => [
      `"${faq.question.replace(/"/g, '""')}"`,
      `"${faq.answer.replace(/"/g, '""')}"`,
      `"${faq.category}"`,
      `"${faq.sourceUrl}"`,
      `"${faq.confidence}"`,
      `"${faq.isIncomplete}"`,
      `"${faq.isDuplicate}"`,
      `"${faq.extractedAt}"`
    ].join(','))
  ].join('\n');

  // Add metadata at the top
  const metadata = [
    `# FAQ Export Metadata`,
    `# Extracted From: ${sourceUrl}`,
    `# Export Date: ${new Date().toISOString()}`,
    `# Total Items: ${faqs.length}`,
    `# Source Domain: ${new URL(sourceUrl).hostname}`,
    ``,
    ``
  ].join('\n');

  const finalContent = metadata + csvContent;

  const blob = new Blob([finalContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `faq-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToExcel = async (faqs: FAQItem[], sourceUrl: string) => {
  // For now, we'll create a detailed CSV that can be opened in Excel
  // In a real implementation, you'd use a library like SheetJS to create actual .xlsx files
  
  const headers = [
    'ID',
    'Question',
    'Answer',
    'Category',
    'Source URL',
    'Confidence Level',
    'Is Incomplete',
    'Is Duplicate', 
    'Extracted At',
    'Word Count (Answer)',
    'Character Count (Answer)'
  ];

  const excelData = faqs.map(faq => [
    faq.id,
    faq.question,
    faq.answer,
    faq.category,
    faq.sourceUrl,
    faq.confidence,
    faq.isIncomplete ? 'Yes' : 'No',
    faq.isDuplicate ? 'Yes' : 'No',
    new Date(faq.extractedAt).toLocaleString(),
    faq.answer.split(' ').length,
    faq.answer.length
  ]);

  // Create CSV content with Excel-friendly formatting
  const csvContent = [
    headers.join('\t'), // Use tabs for better Excel compatibility
    ...excelData.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join('\t')
    )
  ].join('\n');

  // Add metadata sheet (simulated as comments)
  const metadata = [
    `# METADATA SHEET`,
    `# FAQ Export Summary`,
    `# Extracted From\t${sourceUrl}`,
    `# Export Date\t${new Date().toISOString()}`,
    `# Total Items\t${faqs.length}`,
    `# Source Domain\t${new URL(sourceUrl).hostname}`,
    `# High Confidence\t${faqs.filter(f => f.confidence === 'high').length}`,
    `# Medium Confidence\t${faqs.filter(f => f.confidence === 'medium').length}`,
    `# Low Confidence\t${faqs.filter(f => f.confidence === 'low').length}`,
    `# Incomplete Items\t${faqs.filter(f => f.isIncomplete).length}`,
    `# Duplicate Items\t${faqs.filter(f => f.isDuplicate).length}`,
    ``,
    `# FAQ DATA SHEET`,
    ``
  ].join('\n');

  const finalContent = metadata + csvContent;

  const blob = new Blob([finalContent], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;' 
  });
  
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `faq-export-${new Date().toISOString().split('T')[0]}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
