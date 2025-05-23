import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Plus, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  AlertCircle 
} from 'lucide-react';

// Define interfaces for test record data
interface TestRecord {
  id: string;
  name: string;
  date: string;
  subject: string;
  subTopic: string; // Chapter or specific topic
  marks: {
    obtained: number;
    total: number;
  };
  performance: 'excellent' | 'good' | 'average' | 'poor';
  areasToImprove: string[];
  notes: string;
}

export default function TestRecordSection() {
  const { user } = useAuth();
  const [testRecords, setTestRecords] = useState<TestRecord[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  
  // Initial empty test record for the form
  const emptyTestRecord: Omit<TestRecord, 'id' | 'performance'> = {
    name: '',
    date: new Date().toISOString().split('T')[0],
    subject: 'physics',
    subTopic: '', // Add sub-topic/chapter field
    marks: {
      obtained: 0,
      total: 100
    },
    areasToImprove: [],
    notes: ''
  };
  
  // New test form state
  const [newTest, setNewTest] = useState(emptyTestRecord);
  const [areasInput, setAreasInput] = useState('');
  
  // Edit test state
  const [editingTest, setEditingTest] = useState<TestRecord | null>(null);
  const [editAreasInput, setEditAreasInput] = useState('');
  
  // Delete test state
  const [deletingTestId, setDeletingTestId] = useState<string | null>(null);
  
  // Available subjects
  const subjects = [
    { id: 'physics', name: 'Physics' },
    { id: 'chemistry', name: 'Chemistry' },
    { id: 'mathematics', name: 'Mathematics' },
    { id: 'jee_mock', name: 'JEE Mock Test' },
    { id: 'other', name: 'Other' }
  ];

  // Load test records when user changes
  useEffect(() => {
    if (user) {
      loadTestRecords();
    }
  }, [user]);

  // Load test records from localStorage
  const loadTestRecords = () => {
    if (!user) return;
    
    try {
      const testRecordsKey = `chadjee_test_records_${user.id}`;
      const savedData = localStorage.getItem(testRecordsKey);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setTestRecords(parsedData);
      } else {
        // If no data exists, set empty array
        setTestRecords([]);
        localStorage.setItem(testRecordsKey, JSON.stringify([]));
      }
    } catch (error) {
      console.error('Error loading test records:', error);
      setTestRecords([]);
    }
  };

  // Save test records to localStorage
  const saveTestRecords = (updatedRecords: TestRecord[]) => {
    if (!user) return;
    
    try {
      const testRecordsKey = `chadjee_test_records_${user.id}`;
      localStorage.setItem(testRecordsKey, JSON.stringify(updatedRecords));
      setTestRecords(updatedRecords);
    } catch (error) {
      console.error('Error saving test records:', error);
    }
  };

  // Calculate test performance based on percentage
  const calculatePerformance = (obtained: number, total: number): TestRecord['performance'] => {
    const percentage = (obtained / total) * 100;
    
    if (percentage >= 85) return 'excellent';
    if (percentage >= 70) return 'good';
    if (percentage >= 50) return 'average';
    return 'poor';
  };

  // Add a new test record
  const addTestRecord = () => {
    if (!user || !newTest.name.trim()) return;
    
    // Convert comma-separated areas to improve to array
    const areasToImprove = areasInput
      .split(',')
      .map(area => area.trim())
      .filter(Boolean);
    
    const performance = calculatePerformance(
      newTest.marks.obtained,
      newTest.marks.total
    );
    
    const testRecord: TestRecord = {
      id: Date.now().toString(),
      ...newTest,
      areasToImprove,
      performance
    };
    
    const updatedRecords = [...testRecords, testRecord];
    saveTestRecords(updatedRecords);
    
    // Reset form
    setNewTest(emptyTestRecord);
    setAreasInput('');
    setIsAddDialogOpen(false);
  };

  // Update an existing test record
  const updateTestRecord = () => {
    if (!user || !editingTest) return;
    
    // Convert comma-separated areas to improve to array
    const areasToImprove = editAreasInput
      .split(',')
      .map(area => area.trim())
      .filter(Boolean);
    
    const performance = calculatePerformance(
      editingTest.marks.obtained,
      editingTest.marks.total
    );
    
    const updatedTestRecord: TestRecord = {
      ...editingTest,
      areasToImprove,
      performance
    };
    
    const updatedRecords = testRecords.map(record => 
      record.id === editingTest.id ? updatedTestRecord : record
    );
    
    saveTestRecords(updatedRecords);
    setIsEditDialogOpen(false);
    setEditingTest(null);
    setEditAreasInput('');
  };

  // Delete a test record
  const deleteTestRecord = () => {
    if (!user || !deletingTestId) return;
    
    const updatedRecords = testRecords.filter(record => record.id !== deletingTestId);
    saveTestRecords(updatedRecords);
    
    setIsDeleteDialogOpen(false);
    setDeletingTestId(null);
  };

  // Start editing a test record
  const startEditingTest = (test: TestRecord) => {
    setEditingTest(test);
    setEditAreasInput(test.areasToImprove.join(', '));
    setIsEditDialogOpen(true);
  };

  // Start deleting a test record
  const startDeletingTest = (testId: string) => {
    setDeletingTestId(testId);
    setIsDeleteDialogOpen(true);
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setSelectedFilter(value);
  };

  // Filter test records based on subject selection
  const filteredTestRecords = testRecords.filter(record => {
    if (selectedFilter === 'all') return true;
    return record.subject === selectedFilter;
  });

  // Sort test records by date (newest first)
  const sortedTestRecords = [...filteredTestRecords].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Get badge color based on performance
  const getPerformanceBadge = (performance: TestRecord['performance']) => {
    switch (performance) {
      case 'excellent':
        return (
          <Badge className="bg-green-600 hover:bg-green-700">
            Excellent
          </Badge>
        );
      case 'good':
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700">
            Good
          </Badge>
        );
      case 'average':
        return (
          <Badge className="bg-yellow-600 hover:bg-yellow-700">
            Average
          </Badge>
        );
      case 'poor':
        return (
          <Badge className="bg-red-600 hover:bg-red-700">
            Needs Improvement
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-600 hover:bg-slate-700">
            Unrated
          </Badge>
        );
    }
  };

  return (
    <Card className="shadow-lg border-t-4 border-t-red-600">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center">
            <FileText className="h-5 w-5 mr-2 text-red-500" />
            Test Records
          </CardTitle>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="border-red-600 text-red-500 hover:bg-red-950"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Test
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Test Record</DialogTitle>
                <DialogDescription>
                  Add details about your test or exam to track your progress.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="test-name">Test Name</Label>
                  <Input
                    id="test-name"
                    placeholder="e.g., Chapter 5 Quiz, Mock Test 2"
                    value={newTest.name}
                    onChange={(e) => setNewTest({...newTest, name: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-date">Date</Label>
                    <Input
                      id="test-date"
                      type="date"
                      value={newTest.date}
                      onChange={(e) => setNewTest({...newTest, date: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="test-subject">Subject</Label>
                    <Select 
                      value={newTest.subject}
                      onValueChange={(value) => setNewTest({...newTest, subject: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(subject => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="test-chapter">Chapter/Topic</Label>
                  <Input
                    id="test-chapter"
                    placeholder="e.g., Mechanics, Organic Chemistry, Trigonometry"
                    value={newTest.subTopic || ''}
                    onChange={(e) => setNewTest({...newTest, subTopic: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="marks-obtained">Marks Obtained</Label>
                    <Input
                      id="marks-obtained"
                      type="number"
                      min="0"
                      value={newTest.marks.obtained}
                      onChange={(e) => setNewTest({
                        ...newTest, 
                        marks: {
                          ...newTest.marks,
                          obtained: Number(e.target.value)
                        }
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="marks-total">Total Marks</Label>
                    <Input
                      id="marks-total"
                      type="number"
                      min="1"
                      value={newTest.marks.total}
                      onChange={(e) => setNewTest({
                        ...newTest, 
                        marks: {
                          ...newTest.marks,
                          total: Number(e.target.value) || 1
                        }
                      })}
                    />
                  </div>
                </div>
                
                <div className="py-2 px-4 bg-gray-50 rounded-md flex items-center justify-between">
                  <span className="text-sm font-medium">Percentage:</span>
                  <span className="text-lg font-semibold">
                    {Math.round((newTest.marks.obtained / newTest.marks.total) * 100)}%
                  </span>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="areas-to-improve">Areas to Improve (Comma Separated)</Label>
                  <Input
                    id="areas-to-improve"
                    placeholder="e.g., Time management, Integration, Organic Chemistry"
                    value={areasInput}
                    onChange={(e) => setAreasInput(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="test-notes">Additional Notes</Label>
                  <Textarea
                    id="test-notes"
                    placeholder="Any additional notes about the test..."
                    rows={3}
                    value={newTest.notes}
                    onChange={(e) => setNewTest({...newTest, notes: e.target.value})}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addTestRecord} disabled={!newTest.name.trim()}>
                  Save Test Record
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filter */}
        <div className="flex justify-end">
          <Select 
            value={selectedFilter}
            onValueChange={handleFilterChange}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Filter by subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map(subject => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Test Records Table */}
        {sortedTestRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/4">Test Name</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="hidden md:table-cell">Chapter/Topic</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead className="hidden md:table-cell">Performance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTestRecords.map(record => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.name}
                      <div className="md:hidden text-xs text-gray-500 mt-1">
                        {formatDate(record.date)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(record.date)}</TableCell>
                    <TableCell>
                      {subjects.find(s => s.id === record.subject)?.name || 'Other'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {record.subTopic || <span className="text-gray-400">-</span>}
                    </TableCell>
                    <TableCell>
                      {record.marks.obtained} / {record.marks.total}
                      <div className="text-xs text-gray-500">
                        {Math.round((record.marks.obtained / record.marks.total) * 100)}%
                      </div>
                      <div className="md:hidden mt-1">
                        {getPerformanceBadge(record.performance)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {getPerformanceBadge(record.performance)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => startEditingTest(record)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => startDeletingTest(record.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400 opacity-30" />
            <p>No test records found</p>
            <Button 
              variant="link" 
              onClick={() => setIsAddDialogOpen(true)}
              className="mt-2 text-red-500"
            >
              Add your first test record
            </Button>
          </div>
        )}
      </CardContent>
      
      {/* Edit Test Dialog */}
      <Dialog open={isEditDialogOpen && !!editingTest} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Test Record</DialogTitle>
            <DialogDescription>
              Update the details of your test record.
            </DialogDescription>
          </DialogHeader>
          
          {editingTest && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-test-name">Test Name</Label>
                <Input
                  id="edit-test-name"
                  placeholder="e.g., Chapter 5 Quiz, Mock Test 2"
                  value={editingTest.name}
                  onChange={(e) => setEditingTest({...editingTest, name: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-test-date">Date</Label>
                  <Input
                    id="edit-test-date"
                    type="date"
                    value={editingTest.date}
                    onChange={(e) => setEditingTest({...editingTest, date: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-test-subject">Subject</Label>
                  <Select 
                    value={editingTest.subject}
                    onValueChange={(value) => setEditingTest({...editingTest, subject: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subject => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-test-chapter">Chapter/Topic</Label>
                <Input
                  id="edit-test-chapter"
                  placeholder="e.g., Mechanics, Organic Chemistry, Trigonometry"
                  value={editingTest.subTopic || ''}
                  onChange={(e) => setEditingTest({...editingTest, subTopic: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-marks-obtained">Marks Obtained</Label>
                  <Input
                    id="edit-marks-obtained"
                    type="number"
                    min="0"
                    value={editingTest.marks.obtained}
                    onChange={(e) => setEditingTest({
                      ...editingTest, 
                      marks: {
                        ...editingTest.marks,
                        obtained: Number(e.target.value)
                      }
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-marks-total">Total Marks</Label>
                  <Input
                    id="edit-marks-total"
                    type="number"
                    min="1"
                    value={editingTest.marks.total}
                    onChange={(e) => setEditingTest({
                      ...editingTest, 
                      marks: {
                        ...editingTest.marks,
                        total: Number(e.target.value) || 1
                      }
                    })}
                  />
                </div>
              </div>
              
              <div className="py-2 px-4 bg-gray-50 rounded-md flex items-center justify-between">
                <span className="text-sm font-medium">Percentage:</span>
                <span className="text-lg font-semibold">
                  {Math.round((editingTest.marks.obtained / editingTest.marks.total) * 100)}%
                </span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-areas-to-improve">Areas to Improve (Comma Separated)</Label>
                <Input
                  id="edit-areas-to-improve"
                  placeholder="e.g., Time management, Integration, Organic Chemistry"
                  value={editAreasInput}
                  onChange={(e) => setEditAreasInput(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-test-notes">Additional Notes</Label>
                <Textarea
                  id="edit-test-notes"
                  placeholder="Any additional notes about the test..."
                  rows={3}
                  value={editingTest.notes}
                  onChange={(e) => setEditingTest({...editingTest, notes: e.target.value})}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={updateTestRecord} 
              disabled={!editingTest || !editingTest.name.trim()}
            >
              Update Test Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Test Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this test record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteTestRecord}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}