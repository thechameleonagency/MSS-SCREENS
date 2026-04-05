/** Tasks created from enquiry follow-ups are not tied to a real project row. */
export const TASK_PROJECT_ENQUIRY_PLACEHOLDER = '__enquiry__';

export type EnquiryMeetingTaskKindId = 'site_visit' | 'client_meet' | 'phone_followup' | 'internal';

export type EnquiryMeetingTaskType = 'work' | 'call' | 'meeting';

export const ENQUIRY_MEETING_TASK_KINDS: {
  id: EnquiryMeetingTaskKindId;
  label: string;
  taskType: EnquiryMeetingTaskType;
  highlightTechnical: boolean;
}[] = [
  { id: 'site_visit', label: 'Site visit', taskType: 'work', highlightTechnical: true },
  { id: 'client_meet', label: 'Client meeting', taskType: 'meeting', highlightTechnical: false },
  { id: 'phone_followup', label: 'Phone follow-up', taskType: 'call', highlightTechnical: false },
  { id: 'internal', label: 'Internal coordination', taskType: 'meeting', highlightTechnical: false },
];
