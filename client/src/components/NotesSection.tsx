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
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  StickyNote, 
  Plus, 
  Edit2, 
  Trash2, 
  Search,
  Tag
} from 'lucide-react';

// Define interfaces for note data
interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export default function NotesSection() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // New note form state
  const [newNote, setNewNote] = useState<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    content: '',
    category: 'general'
  });
  
  // Edit note state
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  
  // Delete note state
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  
  // Available note categories
  const categories = [
    { id: 'general', name: 'General' },
    { id: 'physics', name: 'Physics' },
    { id: 'chemistry', name: 'Chemistry' },
    { id: 'mathematics', name: 'Mathematics' },
    { id: 'formulas', name: 'Formulas' },
    { id: 'shortcuts', name: 'Shortcuts' }
  ];

  // Load notes when user changes
  useEffect(() => {
    if (user) {
      loadNotes();
    }
  }, [user]);

  // Load notes from localStorage
  const loadNotes = () => {
    if (!user) return;
    
    try {
      const notesKey = `chadjee_notes_${user.id}`;
      const savedData = localStorage.getItem(notesKey);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setNotes(parsedData);
      } else {
        // If no data exists, set empty array
        setNotes([]);
        localStorage.setItem(notesKey, JSON.stringify([]));
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      setNotes([]);
    }
  };

  // Save notes to localStorage
  const saveNotes = (updatedNotes: Note[]) => {
    if (!user) return;
    
    try {
      const notesKey = `chadjee_notes_${user.id}`;
      localStorage.setItem(notesKey, JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  // Add a new note
  const addNote = () => {
    if (!user || !newNote.title.trim()) return;
    
    const now = new Date().toISOString();
    
    const note: Note = {
      id: Date.now().toString(),
      title: newNote.title.trim(),
      content: newNote.content.trim(),
      category: newNote.category,
      createdAt: now,
      updatedAt: now
    };
    
    const updatedNotes = [...notes, note];
    saveNotes(updatedNotes);
    
    // Reset form
    setNewNote({
      title: '',
      content: '',
      category: 'general'
    });
    
    setIsAddDialogOpen(false);
  };

  // Update an existing note
  const updateNote = () => {
    if (!user || !editingNote) return;
    
    const updatedNotes = notes.map(note => 
      note.id === editingNote.id 
        ? { ...editingNote, updatedAt: new Date().toISOString() }
        : note
    );
    
    saveNotes(updatedNotes);
    setIsEditDialogOpen(false);
    setEditingNote(null);
  };

  // Delete a note
  const deleteNote = () => {
    if (!user || !deletingNoteId) return;
    
    const updatedNotes = notes.filter(note => note.id !== deletingNoteId);
    saveNotes(updatedNotes);
    
    setIsDeleteDialogOpen(false);
    setDeletingNoteId(null);
  };

  // Start editing a note
  const startEditingNote = (note: Note) => {
    setEditingNote(note);
    setIsEditDialogOpen(true);
  };

  // Start deleting a note
  const startDeletingNote = (noteId: string) => {
    setDeletingNoteId(noteId);
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

  // Filter notes based on search text and active category
  const filteredNotes = notes.filter(note => {
    const matchesSearch = 
      note.title.toLowerCase().includes(searchText.toLowerCase()) ||
      note.content.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesCategory = 
      activeCategory === 'all' || note.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <Card className="shadow-lg border-t-4 border-t-amber-600">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center">
            <StickyNote className="h-5 w-5 mr-2 text-amber-500" />
            Notes
          </CardTitle>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="border-amber-600 text-amber-500 hover:bg-amber-950"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Note</DialogTitle>
                <DialogDescription>
                  Create a new note for your study materials, formulas, or reminders.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Note title"
                    value={newNote.title}
                    onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={newNote.category}
                    onValueChange={(value) => setNewNote({...newNote, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Note content..."
                    rows={5}
                    value={newNote.content}
                    onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addNote} disabled={!newNote.title.trim()}>
                  Save Note
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search notes..."
              className="pl-9"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          
          <Select 
            value={activeCategory}
            onValueChange={setActiveCategory}
          >
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder="Filter by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Notes Grid */}
        {filteredNotes.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map(note => (
              <Card key={note.id} className="overflow-hidden border-slate-800 bg-slate-850 hover:bg-slate-900/60 transition-colors">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base line-clamp-1">
                      {note.title}
                    </CardTitle>
                    
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-blue-400"
                        onClick={() => startEditingNote(note)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-red-400"
                        onClick={() => startDeletingNote(note.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-4 pt-2">
                  <div className="flex items-center mb-2">
                    <Tag className="h-3 w-3 mr-1 text-slate-400" />
                    <span className="text-xs text-slate-400">
                      {categories.find(c => c.id === note.category)?.name || 'General'}
                    </span>
                    <span className="text-xs text-slate-500 ml-auto">
                      {formatDate(note.updatedAt)}
                    </span>
                  </div>
                  
                  <div className="text-sm line-clamp-4 whitespace-pre-line">
                    {note.content}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            {notes.length === 0 ? (
              <>
                <StickyNote className="h-12 w-12 mx-auto mb-3 text-gray-400 opacity-30" />
                <p>You haven't created any notes yet</p>
                <Button 
                  variant="link" 
                  onClick={() => setIsAddDialogOpen(true)}
                  className="mt-2 text-amber-500"
                >
                  Create your first note
                </Button>
              </>
            ) : (
              <>
                <Search className="h-12 w-12 mx-auto mb-3 text-gray-400 opacity-30" />
                <p>No notes match your search criteria</p>
                <Button 
                  variant="link" 
                  onClick={() => {
                    setSearchText('');
                    setActiveCategory('all');
                  }}
                  className="mt-2 text-amber-500"
                >
                  Clear filters
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
      
      {/* Edit Note Dialog */}
      <Dialog open={isEditDialogOpen && !!editingNote} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>
              Make changes to your note.
            </DialogDescription>
          </DialogHeader>
          
          {editingNote && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  placeholder="Note title"
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({...editingNote, title: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select 
                  value={editingNote.category}
                  onValueChange={(value) => setEditingNote({...editingNote, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  placeholder="Note content..."
                  rows={5}
                  value={editingNote.content}
                  onChange={(e) => setEditingNote({...editingNote, content: e.target.value})}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={updateNote} 
              disabled={!editingNote || !editingNote.title.trim()}
            >
              Update Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteNote}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}