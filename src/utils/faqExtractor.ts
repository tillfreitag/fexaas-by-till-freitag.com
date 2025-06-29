
import type { FAQItem } from "@/types/faq";

// Simulated FAQ extraction service
export const extractFAQs = async (url: string): Promise<FAQItem[]> => {
  // In a real implementation, this would use a web crawler like Puppeteer
  // For demo purposes, we'll generate realistic sample data
  
  const domain = new URL(url).hostname;
  const sampleFAQs: Omit<FAQItem, 'id' | 'extractedAt'>[] = [
    {
      question: "What is your return policy?",
      answer: "We offer a 30-day return policy for all unused items in original packaging. Simply contact our support team to initiate a return.",
      category: "Returns & Refunds",
      sourceUrl: `${url}/faq`,
      confidence: "high",
      isIncomplete: false,
      isDuplicate: false,
    },
    {
      question: "How long does shipping take?",
      answer: "Standard shipping typically takes 3-5 business days. Express shipping is available for 1-2 business day delivery.",
      category: "Shipping",
      sourceUrl: `${url}/support/shipping`,
      confidence: "high",
      isIncomplete: false,
      isDuplicate: false,
    },
    {
      question: "Do you offer international shipping?",
      answer: "Yes, we ship to over 50 countries worldwide. International shipping rates and times vary by location.",
      category: "Shipping",
      sourceUrl: `${url}/support/shipping`,
      confidence: "medium",
      isIncomplete: false,
      isDuplicate: false,
    },
    {
      question: "How can I track my order?",
      answer: "Once your order ships, you'll receive a tracking number via email. You can also check your order status in your account.",
      category: "Orders",
      sourceUrl: `${url}/help/orders`,
      confidence: "high",
      isIncomplete: false,
      isDuplicate: false,
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, Apple Pay, and Google Pay for secure checkout.",
      category: "Payment",
      sourceUrl: `${url}/faq#payment`,
      confidence: "high",
      isIncomplete: false,
      isDuplicate: false,
    },
    {
      question: "Is my personal information secure?",
      answer: "Absolutely. We use industry-standard SSL encryption and never store your payment information on our servers.",
      category: "Security",
      sourceUrl: `${url}/privacy`,
      confidence: "high",
      isIncomplete: false,
      isDuplicate: false,
    },
    {
      question: "Can I cancel my order?",
      answer: "Orders can be cancelled within 1 hour of placement. After that, please contact support.",
      category: "Orders",
      sourceUrl: `${url}/help/orders`,
      confidence: "medium",
      isIncomplete: true,
      isDuplicate: false,
    },
    {
      question: "Do you have a mobile app?",
      answer: "Yes, our mobile app is available on both iOS and Android app stores.",
      category: "Technical",
      sourceUrl: `${url}/mobile`,
      confidence: "low",
      isIncomplete: false,
      isDuplicate: false,
    },
  ];

  // Add some variety based on the domain
  if (domain.includes('shop') || domain.includes('store')) {
    sampleFAQs.push({
      question: "Do you offer price matching?",
      answer: "Yes, we match competitor prices on identical items. Contact us with proof of the lower price.",
      category: "Pricing",
      sourceUrl: `${url}/price-match`,
      confidence: "high",
      isIncomplete: false,
      isDuplicate: false,
    });
  }

  if (domain.includes('tech') || domain.includes('software')) {
    sampleFAQs.push({
      question: "What are the system requirements?",
      answer: "Minimum requirements: Windows 10/macOS 10.15, 4GB RAM, 500MB storage space.",
      category: "Technical",
      sourceUrl: `${url}/system-requirements`,
      confidence: "high",
      isIncomplete: false,
      isDuplicate: false,
    });
  }

  // Generate IDs and timestamps
  return sampleFAQs.map((faq, index) => ({
    ...faq,
    id: `faq-${Date.now()}-${index}`,
    extractedAt: new Date().toISOString(),
  }));
};
