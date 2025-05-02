import axios from 'axios';

const API_URL = 'https://voting-system-5urb.onrender.com'; // backend live

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Voter {
  aadhar_number: string;
  registered: boolean;
  has_voted: boolean;
}

export interface Party {
  name: string;
  votes: number;
}

export interface VoteRequest {
  aadhar_number: string;
  party: string;
}

// Register a voter with face data
export const registerVoter = async (aadhar_number: string, image: File): Promise<Voter> => {
  const formData = new FormData();
  formData.append('aadhar_number', aadhar_number);
  formData.append('file', image);
  
  const response = await api.post('/register', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

// Verify a voter using face recognition
export const verifyVoter = async (image: File): Promise<Voter> => {
  const formData = new FormData();
  formData.append('file', image);
  
  const response = await api.post('/verify', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

// Cast a vote
export const castVote = async (voteRequest: VoteRequest): Promise<any> => {
  const response = await api.post('/vote', voteRequest);
  return response.data;
};

// Get election results
export const getResults = async (): Promise<Party[]> => {
  const response = await api.get('/results');
  return response.data;
};

// Get list of registered voters
export const getRegisteredVoters = async (): Promise<string[]> => {
  const response = await api.get('/voters');
  return response.data;
};

// Delete a specific voter
export const deleteVoter = async (aadharNumber: string): Promise<any> => {
  const response = await api.delete(`/voters/${aadharNumber}`);
  return response.data;
};

// Delete a specific vote
export const deleteVote = async (aadharNumber: string): Promise<any> => {
  const response = await api.delete(`/votes/${aadharNumber}`);
  return response.data;
};

// Reset all votes
export const resetAllVotes = async (): Promise<any> => {
  const response = await api.delete('/reset/votes');
  return response.data;
};

// Reset entire system
export const resetSystem = async (): Promise<any> => {
  const response = await api.delete('/reset/system');
  return response.data;
};

export default api; 