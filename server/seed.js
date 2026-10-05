import { db, initDatabase } from './db.js';
import { hashPassword } from './auth.js';

export async function seedDatabase() {
  initDatabase();

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    console.log('Database already seeded.');
    return;
  }

  console.log('Seeding Korsa database with realistic demo data...');

  const defaultPasswordHash = await hashPassword('learnly123');

  // 1. Insert Subjects
  const insertSubject = db.prepare('INSERT INTO subjects (name, slug, description, icon) VALUES (?, ?, ?, ?)');
  const subjectsData = [
    { name: 'Mathematics', slug: 'mathematics', description: 'Calculus, Algebra, Geometry, and Advanced Exam Preparation', icon: 'Calculator' },
    { name: 'Physics', slug: 'physics', description: 'Mechanics, Electromagnetism, Thermodynamics, and Quantum Physics', icon: 'Atom' },
    { name: 'Chemistry', slug: 'chemistry', description: 'Organic, Inorganic, Physical Chemistry, and Stoichiometry', icon: 'FlaskConical' },
    { name: 'English', slug: 'english', description: 'Academic Writing, Rhetoric, World Literature, and Language Mastery', icon: 'BookOpen' },
    { name: 'Computer Science', slug: 'computer-science', description: 'Algorithms, Data Structures, Python, and Web Development', icon: 'Code' }
  ];

  const subjectMap = {};
  for (const s of subjectsData) {
    const res = insertSubject.run(s.name, s.slug, s.description, s.icon);
    subjectMap[s.slug] = res.lastInsertRowid;
  }

  // 2. Insert Admin User
  const insertUser = db.prepare('INSERT INTO users (email, password_hash, role, name, avatar_url) VALUES (?, ?, ?, ?, ?)');
  const adminRes = insertUser.run('admin@learnly.com', defaultPasswordHash, 'admin', 'System Administrator', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');

  // 3. Insert Teachers
  const insertTeacherProfile = db.prepare(`
    INSERT INTO teacher_profiles 
    (user_id, headline, bio, subjects, educational_levels, monthly_price_cents, is_approved, rating, review_count, subscriber_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const teachersData = [
    {
      name: 'Dr. Jordan Reed',
      email: 'jordan.math@learnly.com',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&auto=format&fit=crop&q=80',
      headline: 'Mathematics Specialist & University Lecturer',
      bio: 'Ph.D. in Applied Mathematics with 14 years of teaching experience. I specialize in breaking down complex calculus, differential equations, and exam preparations into clear, logical steps. My students consistently achieve top percentiles.',
      subjects: JSON.stringify(['Mathematics']),
      educational_levels: JSON.stringify(['Grade 11', 'Grade 12', 'University']),
      monthly_price_cents: 500, // $5.00
      rating: 4.9,
      review_count: 38,
      subscriber_count: 142
    },
    {
      name: 'Elena Rostova',
      email: 'elena.physics@learnly.com',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      headline: 'Physics Teacher & Olympiad Coach',
      bio: 'Passionate about demystifying physical concepts through intuitive thought experiments and systematic problem-solving frameworks. Former International Physics Olympiad trainer with a focus on classical mechanics and electromagnetism.',
      subjects: JSON.stringify(['Physics']),
      educational_levels: JSON.stringify(['Grade 10', 'Grade 11', 'Grade 12']),
      monthly_price_cents: 600, // $6.00
      rating: 4.8,
      review_count: 24,
      subscriber_count: 89
    },
    {
      name: 'Dr. Marcus Vance',
      email: 'marcus.chem@learnly.com',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      headline: 'Senior Chemistry Educator & Researcher',
      bio: 'Award-winning chemistry instructor specializing in organic reaction mechanisms and exam preparation. I turn confusing formulas into visual, memorable models so you understand the "why" behind reactions.',
      subjects: JSON.stringify(['Chemistry']),
      educational_levels: JSON.stringify(['Grade 10', 'Grade 11', 'Grade 12']),
      monthly_price_cents: 500, // $5.00
      rating: 4.9,
      review_count: 29,
      subscriber_count: 110
    },
    {
      name: 'Sarah Jenkins',
      email: 'sarah.english@learnly.com',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      headline: 'English Language & Academic Writing Coach',
      bio: 'Master of Arts in English Literature with a passion for helping students develop precise argumentative writing, analytical reading skills, and confidence in standardized examinations.',
      subjects: JSON.stringify(['English']),
      educational_levels: JSON.stringify(['Grade 10', 'Grade 11', 'Grade 12']),
      monthly_price_cents: 400, // $4.00
      rating: 4.7,
      review_count: 19,
      subscriber_count: 67
    },
    {
      name: 'Tariq Al-Mansoor',
      email: 'tariq.cs@learnly.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      headline: 'Computer Science Instructor & Software Engineer',
      bio: 'Former staff software engineer teaching computer science from first principles. I focus on core foundational concepts: algorithms, computational thinking, data structures, and practical programming with Python.',
      subjects: JSON.stringify(['Computer Science']),
      educational_levels: JSON.stringify(['Grade 10', 'Grade 11', 'Grade 12', 'University']),
      monthly_price_cents: 700, // $7.00
      rating: 5.0,
      review_count: 45,
      subscriber_count: 165
    }
  ];

  const teacherIds = [];
  for (const t of teachersData) {
    const uRes = insertUser.run(t.email, defaultPasswordHash, 'teacher', t.name, t.avatar);
    const userId = uRes.lastInsertRowid;
    teacherIds.push({ userId, name: t.name, subjectSlug: t.subjects.includes('Mathematics') ? 'mathematics' : t.subjects.includes('Physics') ? 'physics' : t.subjects.includes('Chemistry') ? 'chemistry' : t.subjects.includes('English') ? 'english' : 'computer-science', price: t.monthly_price_cents });
    insertTeacherProfile.run(
      userId,
      t.headline,
      t.bio,
      t.subjects,
      t.educational_levels,
      t.monthly_price_cents,
      1,
      t.rating,
      t.review_count,
      t.subscriber_count
    );
  }

  // 4. Insert Sample Students
  const insertStudentProfile = db.prepare('INSERT INTO student_profiles (user_id, educational_level, bio) VALUES (?, ?, ?)');
  const studentsData = [
    {
      name: 'Adam Miller',
      email: 'student@learnly.com',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      educational_level: 'Grade 12',
      bio: 'Preparing for national graduation exams and university engineering entrance.'
    },
    {
      name: 'Maya Lin',
      email: 'maya@learnly.com',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      educational_level: 'Grade 11',
      bio: 'Enthusiastic high school student aiming for a career in computer science and mathematics.'
    }
  ];

  const studentIds = [];
  for (const s of studentsData) {
    const sRes = insertUser.run(s.email, defaultPasswordHash, 'student', s.name, s.avatar);
    studentIds.push(sRes.lastInsertRowid);
    insertStudentProfile.run(sRes.lastInsertRowid, s.educational_level, s.bio);
  }

  // 5. Insert Courses, Sections & Lessons
  const insertCourse = db.prepare(`
    INSERT INTO courses (teacher_id, subject_id, title, description, educational_level, thumbnail_url, is_published)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);
  const insertSection = db.prepare('INSERT INTO sections (course_id, title, order_index) VALUES (?, ?, ?)');
  const insertLesson = db.prepare(`
    INSERT INTO lessons (section_id, course_id, teacher_id, title, description, video_url, duration_minutes, access_level, order_index, is_published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);
  const insertResource = db.prepare(`
    INSERT INTO resources (lesson_id, title, file_url, file_type, access_level)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Course 1: Mathematics - Jordan Reed
  const mathTeacher = teacherIds.find(t => t.name.includes('Jordan'));
  const mathCourseRes = insertCourse.run(
    mathTeacher.userId,
    subjectMap['mathematics'],
    'Mastering Grade 12 Calculus & Differential Equations',
    'A rigorous, concept-first curriculum covering limits, derivatives, chain rule, implicit differentiation, and real-world optimization problems.',
    'Grade 12',
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80'
  );
  const mathCourseId = mathCourseRes.lastInsertRowid;

  const mSec1 = insertSection.run(mathCourseId, 'Foundations of Differential Calculus', 1).lastInsertRowid;
  const mSec2 = insertSection.run(mathCourseId, 'Applications of Derivatives', 2).lastInsertRowid;

  // Lesson 1 - FREE SAMPLE
  const l1 = insertLesson.run(
    mSec1, mathCourseId, mathTeacher.userId,
    'Introduction to Derivatives: Geometric Intuition & Secant Lines',
    'Explore the transition from average rates of change to instantaneous rates of change. Understand the slope of a curve visually without memorizing dry formulas.',
    'https://www.youtube.com/embed/9vKqVkMQHKk', // 3Blue1Brown essence of calculus
    18,
    'FREE',
    1
  ).lastInsertRowid;

  insertResource.run(l1, 'Lecture Notes: Limits & Tangent Lines (PDF)', 'https://example.com/math-notes-01.pdf', 'PDF', 'FREE');
  insertResource.run(l1, 'Practice Problem Set 1 (Derivatives)', 'https://example.com/math-problems-01.pdf', 'PDF', 'FREE');

  // Lesson 2 - SUBSCRIBER ONLY
  const l2 = insertLesson.run(
    mSec1, mathCourseId, mathTeacher.userId,
    'The Power Rule & Trigonometric Derivatives Deep Dive',
    'Rigorous proof and application of the power rule, product rule, quotient rule, and trigonometric function derivatives with 8 walkthrough exam problems.',
    'https://www.youtube.com/embed/S0_qX4VJhMQ',
    24,
    'SUBSCRIBER_ONLY',
    2
  ).lastInsertRowid;
  insertResource.run(l2, 'Formula Sheet: Derivative Rules & Tricks', 'https://example.com/formula-sheet.pdf', 'PDF', 'SUBSCRIBER_ONLY');

  // Lesson 3 - SUBSCRIBER ONLY
  insertLesson.run(
    mSec2, mathCourseId, mathTeacher.userId,
    'Optimization Problems & Extrema on Closed Intervals',
    'Step-by-step strategy for translating word problems into objective functions, finding critical numbers, and proving absolute maximums/minimums.',
    'https://www.youtube.com/embed/1U40B_q_1yA',
    30,
    'SUBSCRIBER_ONLY',
    3
  );

  // Course 2: Physics - Elena Rostova
  const physTeacher = teacherIds.find(t => t.name.includes('Elena'));
  const physCourseRes = insertCourse.run(
    physTeacher.userId,
    subjectMap['physics'],
    'Classical Mechanics & Newton’s Laws in Depth',
    'Understand kinematics, free-body diagrams, circular dynamics, and momentum through intuitive physical diagrams and solved competitive problems.',
    'Grade 11',
    'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&auto=format&fit=crop&q=80'
  );
  const physCourseId = physCourseRes.lastInsertRowid;
  const pSec1 = insertSection.run(physCourseId, 'Kinematics & Coordinate Frames', 1).lastInsertRowid;

  const pl1 = insertLesson.run(
    pSec1, physCourseId, physTeacher.userId,
    'Free-Body Diagrams and Normal Force Myths (Free Sample)',
    'Common traps students fall into when resolving components of weight on inclined planes and how to draw bulletproof free-body diagrams.',
    'https://www.youtube.com/embed/kKKM8Y-u7ds',
    20,
    'FREE',
    1
  ).lastInsertRowid;
  insertResource.run(pl1, 'Guide: Drawing Free-Body Diagrams with Precision', 'https://example.com/physics-fbd.pdf', 'PDF', 'FREE');

  insertLesson.run(
    pSec1, physCourseId, physTeacher.userId,
    'Connected Bodies, Pulleys, and Tension Systems (Subscriber Only)',
    'Solving multi-mass pulley systems and friction transitions using unified system equations.',
    'https://www.youtube.com/embed/8v_g85b5B7U',
    26,
    'SUBSCRIBER_ONLY',
    2
  );

  // Course 3: Computer Science - Tariq Al-Mansoor
  const csTeacher = teacherIds.find(t => t.name.includes('Tariq'));
  const csCourseRes = insertCourse.run(
    csTeacher.userId,
    subjectMap['computer-science'],
    'Foundational Algorithms & Data Structures in Python',
    'Learn how computers process information: Big-O analysis, arrays, linked lists, recursion, trees, and search algorithms taught cleanly.',
    'Grade 12',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80'
  );
  const csCourseId = csCourseRes.lastInsertRowid;
  const csSec1 = insertSection.run(csCourseId, 'Computational Complexity & Basic Structures', 1).lastInsertRowid;

  const csl1 = insertLesson.run(
    csSec1, csCourseId, csTeacher.userId,
    'Demystifying Big-O Time & Space Complexity (Free Sample)',
    'Learn how to measure algorithm performance without relying on machine clock speed. Understand O(1), O(log n), O(n), and O(n^2) with concrete visual benchmarks.',
    'https://www.youtube.com/embed/D6xkbGLQesk',
    22,
    'FREE',
    1
  ).lastInsertRowid;
  insertResource.run(csl1, 'Cheatsheet: Big-O Asymptotic Notations', 'https://example.com/big-o-cheatsheet.pdf', 'PDF', 'FREE');

  insertLesson.run(
    csSec1, csCourseId, csTeacher.userId,
    'Binary Search & Two-Pointer Strategies (Subscriber Only)',
    'Deep dive into divide-and-conquer principles and why binary search is one of the most powerful algorithms in computer science.',
    'https://www.youtube.com/embed/MFhxShGxHWc',
    28,
    'SUBSCRIBER_ONLY',
    2
  );

  // 6. Insert Simulated Subscription for Sample Student
  // Student 1 (Adam Miller) is subscribed to Dr. Jordan Reed
  const insertSub = db.prepare(`
    INSERT INTO subscriptions (student_id, teacher_id, price_cents, status, started_at, renewal_at)
    VALUES (?, ?, ?, 'active', datetime('now', '-15 days'), datetime('now', '+15 days'))
  `);
  const subRes = insertSub.run(studentIds[0], mathTeacher.userId, mathTeacher.price);

  // Record simulated payment: $5 total, 20% platform ($1), $4 teacher
  const insertPayment = db.prepare(`
    INSERT INTO payments (subscription_id, student_id, teacher_id, amount_cents, platform_commission_cents, teacher_earnings_cents, status, simulated)
    VALUES (?, ?, ?, ?, ?, ?, 'completed', 1)
  `);
  insertPayment.run(subRes.lastInsertRowid, studentIds[0], mathTeacher.userId, 500, 100, 400);

  // 7. Insert Learning Progress for Adam
  const insertProgress = db.prepare(`
    INSERT INTO progress (student_id, course_id, lesson_id, completed, last_watched_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `);
  // Completed lesson 1, started lesson 2
  insertProgress.run(studentIds[0], mathCourseId, l1, 1);
  insertProgress.run(studentIds[0], mathCourseId, l2, 0);

  // 8. Insert Reviews
  const insertReview = db.prepare(`
    INSERT INTO reviews (student_id, teacher_id, rating, comment)
    VALUES (?, ?, ?, ?)
  `);
  insertReview.run(
    studentIds[0],
    mathTeacher.userId,
    5,
    'Dr. Reed is easily the best math teacher I have ever had. The way he explained derivatives cleared up months of confusion in under an hour.'
  );
  insertReview.run(
    studentIds[1],
    physTeacher.userId,
    5,
    'Elena’s physics free-body breakdown was a game changer for my exam scores. Highly recommend subscribing!'
  );

  console.log('Korsa database seeded successfully!');
}
