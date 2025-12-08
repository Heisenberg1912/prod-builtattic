// Mock inquiries data for development

export const mockInquiries = [
  {
    id: 'inquiry-1',
    recipientId: 'demo-user-1',
    senderId: 'buyer-1',
    senderName: 'John Smith',
    senderEmail: 'john.smith@example.com',
    senderPhone: '+1 234 567 8900',
    subject: 'Interested in Modern Coastal Villa Design',
    message: 'Hi! I\'m very interested in your Modern Coastal Villa design. I have a plot in Malibu and would love to discuss customizing this design for my location. Could we schedule a call this week?',
    itemType: 'design',
    itemId: 'design-1',
    itemTitle: 'Modern Coastal Villa Design',
    read: false,
    archived: false,
    replies: [],
    createdAt: '2025-01-26T14:30:00Z',
    updatedAt: '2025-01-26T14:30:00Z',
  },
  {
    id: 'inquiry-2',
    recipientId: 'demo-user-1',
    senderId: 'buyer-2',
    senderName: 'Sarah Johnson',
    senderEmail: 'sarah.j@example.com',
    senderPhone: '+1 345 678 9012',
    subject: 'Quote for 3D Visualization Service',
    message: 'Hello, I need 3D renders for a residential project. The project is a 2-story house, approximately 2800 sqft. I would need 6 exterior views and 4 interior views. What would be the pricing and timeline for this?',
    itemType: 'service',
    itemId: 'service-1',
    itemTitle: '3D Architectural Visualization',
    read: true,
    archived: false,
    replies: [
      {
        id: 'reply-1',
        senderId: 'demo-user-1',
        message: 'Hi Sarah! Thanks for reaching out. For your requirements (6 exterior + 4 interior views), I would recommend the Premium package with some customization. The total would be around $2,800 with a 10-day delivery timeline. I can provide a detailed quote if you share the project files. Best regards!',
        createdAt: '2025-01-25T16:00:00Z',
      },
    ],
    createdAt: '2025-01-25T10:15:00Z',
    updatedAt: '2025-01-25T16:00:00Z',
  },
  {
    id: 'inquiry-3',
    recipientId: 'demo-user-1',
    senderId: 'buyer-3',
    senderName: 'Michael Chen',
    senderEmail: 'mchen@techcorp.com',
    senderPhone: '+1 456 789 0123',
    subject: 'Office Complex Design Inquiry',
    message: 'We are a tech startup looking for an office space design. Your Contemporary Office Complex caught our attention. We need a space for about 150 employees with open collaboration areas. Is this design customizable?',
    itemType: 'design',
    itemId: 'design-3',
    itemTitle: 'Contemporary Office Complex',
    read: true,
    archived: false,
    replies: [
      {
        id: 'reply-2',
        senderId: 'demo-user-1',
        message: 'Hi Michael, absolutely! This design is fully customizable. I\'d love to discuss your specific requirements. Can you share more details about the plot size and any specific features you\'re looking for? Let\'s set up a meeting to discuss further.',
        createdAt: '2025-01-24T11:00:00Z',
      },
      {
        id: 'reply-3',
        senderId: 'buyer-3',
        message: 'Great! We have a 20,000 sqft plot in downtown. We need an open-plan office with breakout zones, a cafeteria, and parking for 60 cars. Can we meet next Tuesday?',
        createdAt: '2025-01-24T14:30:00Z',
      },
    ],
    createdAt: '2025-01-24T09:45:00Z',
    updatedAt: '2025-01-24T14:30:00Z',
  },
  {
    id: 'inquiry-4',
    recipientId: 'demo-user-1',
    senderId: 'buyer-4',
    senderName: 'Emily Rodriguez',
    senderEmail: 'emily.r@gmail.com',
    senderPhone: '+1 567 890 1234',
    subject: 'Interior Design for New Apartment',
    message: 'I just bought a 1200 sqft apartment and need help with interior design. I love minimalist Scandinavian style. Do you offer virtual consultations?',
    itemType: 'service',
    itemId: 'service-2',
    itemTitle: 'Interior Design Consultation',
    read: false,
    archived: false,
    replies: [],
    createdAt: '2025-01-26T11:20:00Z',
    updatedAt: '2025-01-26T11:20:00Z',
  },
  {
    id: 'inquiry-5',
    recipientId: 'demo-user-1',
    senderId: 'buyer-5',
    senderName: 'David Park',
    senderEmail: 'dpark@residences.com',
    senderPhone: '+1 678 901 2345',
    subject: 'Bulk Rendering Project',
    message: 'We are a real estate development company with 12 residential units that need 3D renders. Each unit would need 2-3 views. What kind of package deal can you offer for this volume?',
    itemType: 'service',
    itemId: 'service-1',
    itemTitle: '3D Architectural Visualization',
    read: true,
    archived: true,
    replies: [],
    createdAt: '2025-01-20T15:00:00Z',
    updatedAt: '2025-01-23T09:00:00Z',
  },
];

// Function to seed mock data to localStorage
export const seedMockInquiries = () => {
  const existing = localStorage.getItem('associate_inquiries');
  if (!existing || JSON.parse(existing).length === 0) {
    localStorage.setItem('associate_inquiries', JSON.stringify(mockInquiries));
    console.log('Mock inquiries seeded successfully');
    return true;
  }
  console.log('Inquiries already exist in localStorage');
  return false;
};

// Function to clear all inquiries
export const clearInquiries = () => {
  localStorage.removeItem('associate_inquiries');
  console.log('All inquiries cleared');
};

// Function to reset to mock data
export const resetToMockInquiries = () => {
  localStorage.setItem('associate_inquiries', JSON.stringify(mockInquiries));
  console.log('Reset to mock inquiries');
};

// Seed all mock data at once
export const seedAllMockData = () => {
  seedMockInquiries();
  // Import and call other seed functions as needed
};
