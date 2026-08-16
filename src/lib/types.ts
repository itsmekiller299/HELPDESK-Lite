export type Ticket = {
  id: number;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assigned_to?: number | null;
  assignee?: { name: string } | null;
  auto_suggested?: boolean | number;
  created_at: string;
  sla?: { status: string; remainingHours: number };
};

export type Agent = { id: number; name: string };

export type Article = { id: number; title: string; body: string; category: string };

export type ClassificationSuggestion = {
  suggestedCategory: string;
  suggestedPriority: string;
};

export type AnalyticsData = {
  totalTickets: number;
  sla: { onTrack: number; atRisk: number; breached: number };
  byStatus: { status: string; count: number }[];
  byPriority: { priority: string; count: number }[];
  byCategory: { category: string; count: number }[];
  recentTickets: (Ticket & { customer_name: string })[];
};

export type Notification = {
  id: number;
  message: string;
  ticket_id: number | null;
  is_read: number;
  created_at: string;
};

export type TicketSummary = {
  facts: {
    subject: string;
    status: string;
    priority: string;
    category: string;
    assignee: string | null;
    customer: string | null;
    created_at: string;
    last_activity: string;
    replyCount: number;
  };
  points: string[];
  questions: string[];
  participants: string[];
};
