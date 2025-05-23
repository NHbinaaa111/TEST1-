import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Trash2, 
  Calculator, 
  Atom, 
  FlaskConical, 
  Book,
  Search
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { testRecordService } from '@/services/testRecordService';
import { TestRecord } from '@/hooks/use-jee-recommendations';
import AddTestResultForm from './AddTestResultForm';

export default function TestRecordsList() {
  const { user } = useAuth();
  const [testRecords, setTestRecords] = useState<TestRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Load test records
  const loadTestRecords = async () => {
    if (!user?.id) {
      setTestRecords([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const records = await testRecordService.fetchTestRecords(user.id);
      // Sort by date (newest first)
      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTestRecords(records);
    } catch (error) {
      console.error('Error loading test records:', error);
      setError('Failed to load test records. Please refresh the page and try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Load records on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      loadTestRecords();
    }
  }, [user]);
  
  // Handle delete
  const handleDelete = async (recordId: string | number) => {
    if (!user?.id) return;
    
    if (window.confirm('Are you sure you want to delete this test record?')) {
      setDeletingId(recordId);
      setIsDeleting(true);
      setError(null);
      
      try {
        await testRecordService.deleteTestRecord(user.id, recordId);
        loadTestRecords(); // Reload the list
      } catch (error) {
        console.error('Error deleting test record:', error);
        setError('Failed to delete test record. Please try again.');
      } finally {
        setIsDeleting(false);
        setDeletingId(null);
      }
    }
  };
  
  // Get appropriate icon for a subject
  const getSubjectIcon = (subject: string) => {
    switch (subject) {
      case 'Mathematics':
        return <Calculator className="h-4 w-4" />;
      case 'Physics':
        return <Atom className="h-4 w-4" />;
      case 'Chemistry':
        return <FlaskConical className="h-4 w-4" />;
      default:
        return <Book className="h-4 w-4" />;
    }
  };
  
  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Calculate percentage score
  const calculatePercentage = (marksObtained: number, marksTotal: number) => {
    return Math.round((marksObtained / marksTotal) * 100);
  };
  
  // Get color class based on score percentage
  const getScoreColor = (marksObtained: number, marksTotal: number) => {
    const percentage = calculatePercentage(marksObtained, marksTotal);
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  // Filter records based on selected subject and search term
  const filteredRecords = testRecords.filter(record => {
    // Apply subject filter
    if (filterSubject !== 'all' && record.subject !== filterSubject) {
      return false;
    }
    
    // Apply search term filter (case insensitive)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        record.subject.toLowerCase().includes(term) ||
        (record.subTopic && record.subTopic.toLowerCase().includes(term)) ||
        (record.areasToImprove && 
          record.areasToImprove.some(area => area.toLowerCase().includes(term)))
      );
    }
    
    return true;
  });
  
  return (
    <Card className="shadow-md border-indigo-700">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-400" />
              <span>Test Records</span>
            </CardTitle>
            <CardDescription>
              Track your test performance to get insights and recommendations
            </CardDescription>
          </div>
          <AddTestResultForm onTestAdded={loadTestRecords} />
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="p-3 mb-4 text-sm bg-red-500/10 border border-red-500/20 text-red-500 rounded-md">
            {error}
            <Button 
              variant="link" 
              className="p-0 ml-2 h-auto text-red-500 font-semibold"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </div>
        )}
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by subject, topic or improvement areas"
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              <SelectItem value="Mathematics">Mathematics</SelectItem>
              <SelectItem value="Physics">Physics</SelectItem>
              <SelectItem value="Chemistry">Chemistry</SelectItem>
              <SelectItem value="General Study">General Study</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {loading ? (
          <div className="text-center py-8 flex flex-col items-center justify-center gap-2">
            <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div className="text-muted-foreground mt-2">Loading test records...</div>
          </div>
        ) : testRecords.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-md">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">No test records added yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add your JEE test results to get personalized study recommendations.
            </p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-md">
            <Search className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">No matching test records found.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try changing your filters or search for different subject, topic, or improvement areas.
            </p>
            <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">
              Tip: You can search for specific concepts you want to improve, like "integration" or "chemical bonding".
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Areas of Improvement</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map(record => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {getSubjectIcon(record.subject)}
                        </span>
                        <div>
                          <div className="font-medium">{record.subject}</div>
                          {record.subTopic && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              <Badge variant="outline" className="font-normal">
                                {record.subTopic}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDate(record.date)}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">
                        <span className={getScoreColor(record.marksObtained, record.marksTotal)}>
                          {calculatePercentage(record.marksObtained, record.marksTotal)}%
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {record.marksObtained} / {record.marksTotal}
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.areasToImprove && record.areasToImprove.length > 0 ? (
                        <div className="text-sm max-w-xs">
                          <p className="line-clamp-2">{record.areasToImprove.join(', ')}</p>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground italic">
                          No areas specified
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(record.id)}
                        disabled={isDeleting && deletingId === record.id}
                        className="text-red-500 hover:text-red-600 hover:bg-red-100/10"
                      >
                        {isDeleting && deletingId === record.id ? (
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
