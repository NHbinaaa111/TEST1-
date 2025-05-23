import { apiRequest } from '@/lib/queryClient';
import { TestRecord } from '@/hooks/use-jee-recommendations';

// Updated types for database API compatibility
export interface DbTestRecord {
  id: number;
  userId: number;
  name: string;
  date: string;
  subject: string;
  subTopic?: string;
  marksObtained: number;
  marksTotal: number;
  performance: 'excellent' | 'good' | 'average' | 'poor';
  areasToImprove?: string[];
  notes?: string;
  createdAt: string;
}

// Extend TestRecord type to include notes
export interface ExtendedTestRecord extends TestRecord {
  notes?: string;
}

// Service for managing test records via API
class TestRecordService {
  // Fetch all test records for a user
  async fetchTestRecords(userId: number | string): Promise<TestRecord[]> {
    if (!userId) return [];
    
    try {
      const response = await fetch(`/api/users/${userId}/test-records`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch test records');
      }
      
      const data = await response.json();
      if (!Array.isArray(data)) {
        console.error('Expected array response from test records API, got:', data);
        return [];
      }
      
          // Map the DB records to the format expected by the application
      return data.map((record: DbTestRecord) => ({
        id: record.id,
        subject: record.subject,
        subTopic: record.subTopic,
        marksObtained: record.marksObtained,
        marksTotal: record.marksTotal,
        date: record.date,
        areasToImprove: record.areasToImprove,
        performance: record.performance,
        notes: record.notes
      }));
    } catch (error) {
      console.error('Error fetching test records:', error);
      return [];
    }
  }

  // Save a new test record
  async addTestRecord(userId: number | string, record: Omit<ExtendedTestRecord, 'id'>): Promise<TestRecord> {
    if (!userId) throw new Error('User ID is required');
    
    try {
      // Convert to database format
      const dbRecord = {
        userId: Number(userId),
        name: record.subTopic || `${record.subject} Test`,
        date: record.date,
        subject: record.subject,
        subTopic: record.subTopic,
        marksObtained: record.marksObtained,
        marksTotal: record.marksTotal,
        performance: record.performance || 
          (record.marksObtained / record.marksTotal >= 0.8 ? 'excellent' : 
           record.marksObtained / record.marksTotal >= 0.6 ? 'good' : 
           record.marksObtained / record.marksTotal >= 0.4 ? 'average' : 'poor'),
        areasToImprove: record.areasToImprove || [],
        notes: record.notes
      };
      
      const response = await fetch('/api/test-records', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dbRecord)
      });
      
      if (!response.ok) {
        throw new Error('Failed to add test record');
      }
      
      const newRecord = await response.json();
      
      // Map back to application format
      return {
        id: newRecord.id,
        subject: newRecord.subject,
        subTopic: newRecord.subTopic,
        marksObtained: newRecord.marksObtained,
        marksTotal: newRecord.marksTotal,
        date: newRecord.date,
        areasToImprove: newRecord.areasToImprove,
        performance: newRecord.performance,
        notes: newRecord.notes
      };
    } catch (error) {
      console.error('Error adding test record:', error);
      throw error;
    }
  }

  // Update an existing test record
  async updateTestRecord(userId: number | string, recordId: string, updates: Partial<ExtendedTestRecord>): Promise<TestRecord> {
    if (!userId) throw new Error('User ID is required');
    if (!recordId) throw new Error('Record ID is required');
    
    try {
      // Convert to database format
      const dbUpdates: Partial<DbTestRecord> = {};
      
      if (updates.subject) dbUpdates.subject = updates.subject;
      if (updates.subTopic) dbUpdates.subTopic = updates.subTopic;
      if (updates.marksObtained !== undefined) dbUpdates.marksObtained = updates.marksObtained;
      if (updates.marksTotal !== undefined) dbUpdates.marksTotal = updates.marksTotal;
      if (updates.date) dbUpdates.date = updates.date;
      if (updates.areasToImprove) dbUpdates.areasToImprove = updates.areasToImprove;
      if (updates.performance) dbUpdates.performance = updates.performance;
      if (updates.notes) dbUpdates.notes = updates.notes;
      
      const response = await fetch(`/api/test-records/${recordId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dbUpdates)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update test record');
      }
      
      const updatedRecord = await response.json();
      
      // Map back to application format
      return {
        id: updatedRecord.id,
        subject: updatedRecord.subject,
        subTopic: updatedRecord.subTopic,
        marksObtained: updatedRecord.marksObtained,
        marksTotal: updatedRecord.marksTotal,
        date: updatedRecord.date,
        areasToImprove: updatedRecord.areasToImprove,
        performance: updatedRecord.performance,
        notes: updatedRecord.notes
      };
    } catch (error) {
      console.error('Error updating test record:', error);
      throw error;
    }
  }

  // Delete a test record
  async deleteTestRecord(userId: number | string, recordId: string | number): Promise<boolean> {
    if (!userId) throw new Error('User ID is required');
    if (!recordId) throw new Error('Record ID is required');
    
    try {
      const response = await fetch(`/api/test-records/${recordId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete test record');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting test record:', error);
      return false;
    }
  }
}

export const testRecordService = new TestRecordService();
