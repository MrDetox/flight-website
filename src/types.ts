export interface Flight {
  id: string;
  origin: string;
  destination: string;
  price: number;
  directPrice: number;
  currency: string;
  segments: FlightSegment[];
  layoverCity?: string;
  layoverDuration?: string;
  layoverHours?: number;
  vibeTags: string[];
  estimatedLayoverCost: number;
  aiTeaser: string;
}

export interface FlightSegment {
  from: string;
  to: string;
  departure: string;
  arrival: string;
  departureDate?: string;
  arrivalDate?: string;
  carrier: string;
  duration: string;
  type: 'flight' | 'ground';
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
}

export interface SearchParams {
  origin: string;
  destination: string;
  homeCity?: string;
  earliestDate?: string;
  mustBeDate: string;
  tripDays?: { min: number; max: number };
}
