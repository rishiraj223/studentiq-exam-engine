import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// For prototyping without database schema changes
const NOTES_FILE_PATH = path.join(process.cwd(), 'data', 'student_notes.json');

// Helper to read notes
function getNotesDB() {
  try {
    if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
      fs.mkdirSync(path.join(process.cwd(), 'data'));
    }
    if (!fs.existsSync(NOTES_FILE_PATH)) {
      fs.writeFileSync(NOTES_FILE_PATH, JSON.stringify({}));
    }
    const data = fs.readFileSync(NOTES_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

// Helper to write notes
function saveNotesDB(db: any) {
  fs.writeFileSync(NOTES_FILE_PATH, JSON.stringify(db, null, 2));
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const sessionCookie = req.cookies.get('exam_coaching_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { studentId } = await params;
    const db = getNotesDB();
    const notes = db[studentId] || [];
    
    return NextResponse.json({ notes });
  } catch (err) {
    console.error('Get Notes Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const sessionCookie = req.cookies.get('exam_coaching_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const session = JSON.parse(decodeURIComponent(sessionCookie));
    const adminName = session.coaching_name || 'Admin';
    
    const { studentId } = await params;
    const { note } = await req.json();
    
    if (!note || !note.trim()) {
      return NextResponse.json({ error: 'Note cannot be empty' }, { status: 400 });
    }

    const db = getNotesDB();
    if (!db[studentId]) db[studentId] = [];
    
    const newNote = {
      id: Date.now().toString(),
      text: note.trim(),
      author: adminName,
      created_at: new Date().toISOString()
    };
    
    // Prepend so newest is first
    db[studentId] = [newNote, ...db[studentId]];
    saveNotesDB(db);
    
    return NextResponse.json({ notes: db[studentId] });
  } catch (err) {
    console.error('Post Notes Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
