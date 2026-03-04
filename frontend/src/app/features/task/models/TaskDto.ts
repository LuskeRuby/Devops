export interface TaskDTO {
  id: number;
  name: string;
  description: string;
  points: number;
  checked: boolean;
  
  // Dates are received as strings (ISO 8601) from JSON
  timestamp: string; 
  repeatUntil: string;
  
  repeatEvery: 'Daily' | 'Weekly' | 'Monthly' | string;

  // Foreign Key references (IDs) instead of full objects
  imageId?: number; 
}