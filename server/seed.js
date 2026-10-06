import { db, initDatabase } from './db.js';
import { hashPassword } from './auth.js';

export async function seedDatabase() {
  await initDatabase();

  const countRow = await db.prepare('SELECT COUNT(*) as count FROM users').get();
  const userCount = countRow ? Number(countRow.count) : 0;
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
    const res = await insertSubject.run(s.name, s.slug, s.description, s.icon);
    subjectMap[s.slug] = res.lastInsertRowid;
  }

  // 2. Insert Admin User
  const insertUser = db.prepare('INSERT INTO users (email, password_hash, role, name, avatar_url) VALUES (?, ?, ?, ?, ?)');
  await insertUser.run('admin@learnly.com', defaultPasswordHash, 'admin', 'System Administrator', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');

  // 3. Insert Teachers
  const insertTeacherProfile = db.prepare(`
    INSERT INTO teacher_profiles 
    (user_id, handle, tier, headline, bio, custom_bio, external_links, referral_code, commission_rate, subjects, educational_levels, monthly_price_cents, is_approved, rating, review_count, subscriber_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const teachersData = [
    {
      name: 'Dr. Jordan Reed',
      email: 'jordan.math@learnly.com',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&auto=format&fit=crop&q=80',
      handle: 'jordan',
      tier: 'expert_creator',
      referral_code: 'JORDAN2026',
      commission_rate: 0.10,
      headline: 'Mathematics Specialist & University Lecturer',
      bio: 'Ph.D. in Applied Mathematics with 14 years of teaching experience. I specialize in breaking down complex calculus, differential equations, and exam preparations into clear, logical steps. My students consistently achieve top percentiles.',
      custom_bio: 'Welcome! I help high school and university students conquer Calculus, Differential Equations, and STEM admissions. Access my free roadmaps or book 1-on-1 problem reviews.',
      external_links: JSON.stringify({
        linkedin: 'https://linkedin.com/in/jordanreed',
        youtube: 'https://youtube.com/@jordanreedmath',
        twitter: 'https://x.com/jordanreed'
      }),
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
      handle: 'elena',
      tier: 'expert_creator',
      referral_code: 'ELENA2026',
      commission_rate: 0.10,
      headline: 'Physics Teacher & Olympiad Coach',
      bio: 'Passionate about demystifying physical concepts through intuitive thought experiments and systematic problem-solving frameworks. Former International Physics Olympiad trainer with a focus on classical mechanics and electromagnetism.',
      custom_bio: 'Physics is intuitive when taught visually. Check out my free Free-Body Diagram guide or join my interactive problem-solving office hours.',
      external_links: JSON.stringify({
        youtube: 'https://youtube.com/@elenaphysics',
        linkedin: 'https://linkedin.com/in/elenarostova'
      }),
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
      handle: 'marcus',
      tier: 'community_tutor',
      referral_code: 'MARCUS2026',
      commission_rate: 0.10,
      headline: 'Senior Chemistry Educator & Researcher',
      bio: 'Award-winning chemistry instructor specializing in organic reaction mechanisms and exam preparation. I turn confusing formulas into visual, memorable models so you understand the "why" behind reactions.',
      custom_bio: 'Community tutor helping chemistry students ace their high school graduation and university chemistry prerequisites.',
      external_links: JSON.stringify({
        youtube: 'https://youtube.com/@marcuschem'
      }),
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
      handle: 'sarah',
      tier: 'community_tutor',
      referral_code: 'SARAH2026',
      commission_rate: 0.10,
      headline: 'English Language & Academic Writing Coach',
      bio: 'Master of Arts in English Literature with a passion for helping students develop precise argumentative writing, analytical reading skills, and confidence in standardized examinations.',
      custom_bio: 'Providing affordable micro-essay reviews and academic writing feedback for college-bound students.',
      external_links: JSON.stringify({
        linkedin: 'https://linkedin.com/in/sarahjenkins'
      }),
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
      handle: 'tariq',
      tier: 'expert_creator',
      referral_code: 'TARIQ2026',
      commission_rate: 0.10,
      headline: 'Computer Science Instructor & Software Engineer',
      bio: 'Former staff software engineer teaching computer science from first principles. I focus on core foundational concepts: algorithms, computational thinking, data structures, and practical programming with Python.',
      custom_bio: 'Learn software engineering the right way: clean data structures, Big-O analysis, and practical coding interviews.',
      external_links: JSON.stringify({
        github: 'https://github.com/tariqdev',
        youtube: 'https://youtube.com/@tariqcs'
      }),
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
    const uRes = await insertUser.run(t.email, defaultPasswordHash, 'teacher', t.name, t.avatar);
    const userId = uRes.lastInsertRowid;
    teacherIds.push({ userId, name: t.name, subjectSlug: t.subjects.includes('Mathematics') ? 'mathematics' : t.subjects.includes('Physics') ? 'physics' : t.subjects.includes('Chemistry') ? 'chemistry' : t.subjects.includes('English') ? 'english' : 'computer-science', price: t.monthly_price_cents });
    await insertTeacherProfile.run(
      userId,
      t.handle,
      t.tier,
      t.headline,
      t.bio,
      t.custom_bio,
      t.external_links,
      t.referral_code,
      t.commission_rate,
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
    const sRes = await insertUser.run(s.email, defaultPasswordHash, 'student', s.name, s.avatar);
    studentIds.push(sRes.lastInsertRowid);
    await insertStudentProfile.run(sRes.lastInsertRowid, s.educational_level, s.bio);
  }

  // 5. Insert Courses, Sections & Lessons
  const insertCourse = db.prepare(`
    INSERT INTO courses (teacher_id, subject_id, title, description, educational_level, thumbnail_url, is_published)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);
  const insertSection = db.prepare('INSERT INTO sections (course_id, title, order_index) VALUES (?, ?, ?)');
  const insertLesson = db.prepare(`
    INSERT INTO lessons (section_id, course_id, teacher_id, title, description, video_url, duration_minutes, access_level, is_free_preview, order_index, is_published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);
  const insertResource = db.prepare(`
    INSERT INTO resources (lesson_id, title, file_url, file_type, access_level, is_free_preview)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Course 1: Mathematics - Jordan Reed
  const mathTeacher = teacherIds.find(t => t.name.includes('Jordan'));
  const mathCourseRes = await insertCourse.run(
    mathTeacher.userId,
    subjectMap['mathematics'],
    'Mastering Grade 12 Calculus & Differential Equations',
    'A rigorous, concept-first curriculum covering limits, derivatives, chain rule, implicit differentiation, and real-world optimization problems.',
    'Grade 12',
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80'
  );
  const mathCourseId = mathCourseRes.lastInsertRowid;

  const mSec1Res = await insertSection.run(mathCourseId, 'Foundations of Differential Calculus', 1);
  const mSec1 = mSec1Res.lastInsertRowid;
  const mSec2Res = await insertSection.run(mathCourseId, 'Applications of Derivatives', 2);
  const mSec2 = mSec2Res.lastInsertRowid;

  // Lesson 1 - FREE SAMPLE
  const l1Res = await insertLesson.run(
    mSec1, mathCourseId, mathTeacher.userId,
    'Introduction to Derivatives: Geometric Intuition & Secant Lines',
    'Explore the transition from average rates of change to instantaneous rates of change. Understand the slope of a curve visually without memorizing dry formulas.',
    'https://www.youtube.com/embed/9vKqVkMQHKk',
    18,
    'FREE',
    1,
    1
  );
  const l1 = l1Res.lastInsertRowid;

  await insertResource.run(l1, 'Lecture Notes: Limits & Tangent Lines (PDF)', 'https://example.com/math-notes-01.pdf', 'PDF', 'FREE', 1);
  await insertResource.run(l1, 'Practice Problem Set 1 (Derivatives)', 'https://example.com/math-problems-01.pdf', 'PDF', 'FREE', 1);

  // Lesson 2 - SUBSCRIBER ONLY
  const l2Res = await insertLesson.run(
    mSec1, mathCourseId, mathTeacher.userId,
    'The Power Rule & Trigonometric Derivatives Deep Dive',
    'Rigorous proof and application of the power rule, product rule, quotient rule, and trigonometric function derivatives with 8 walkthrough exam problems.',
    'https://www.youtube.com/embed/S0_qX4VJhMQ',
    24,
    'SUBSCRIBER_ONLY',
    0,
    2
  );
  const l2 = l2Res.lastInsertRowid;
  await insertResource.run(l2, 'Formula Sheet: Derivative Rules & Tricks', 'https://example.com/formula-sheet.pdf', 'PDF', 'SUBSCRIBER_ONLY', 0);

  // Lesson 3 - SUBSCRIBER ONLY
  await insertLesson.run(
    mSec2, mathCourseId, mathTeacher.userId,
    'Optimization Problems & Extrema on Closed Intervals',
    'Step-by-step strategy for translating word problems into objective functions, finding critical numbers, and proving absolute maximums/minimums.',
    'https://www.youtube.com/embed/1U40B_q_1yA',
    30,
    'SUBSCRIBER_ONLY',
    0,
    3
  );

  // Course 2: Physics - Elena Rostova
  const physTeacher = teacherIds.find(t => t.name.includes('Elena'));
  const physCourseRes = await insertCourse.run(
    physTeacher.userId,
    subjectMap['physics'],
    'Classical Mechanics & Newton’s Laws in Depth',
    'Understand kinematics, free-body diagrams, circular dynamics, and momentum through intuitive physical diagrams and solved competitive problems.',
    'Grade 11',
    'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&auto=format&fit=crop&q=80'
  );
  const physCourseId = physCourseRes.lastInsertRowid;
  const pSec1Res = await insertSection.run(physCourseId, 'Kinematics & Coordinate Frames', 1);
  const pSec1 = pSec1Res.lastInsertRowid;

  const pl1Res = await insertLesson.run(
    pSec1, physCourseId, physTeacher.userId,
    'Free-Body Diagrams and Normal Force Myths (Free Sample)',
    'Common traps students fall into when resolving components of weight on inclined planes and how to draw bulletproof free-body diagrams.',
    'https://www.youtube.com/embed/kKKM8Y-u7ds',
    20,
    'FREE',
    1,
    1
  );
  const pl1 = pl1Res.lastInsertRowid;
  await insertResource.run(pl1, 'Guide: Drawing Free-Body Diagrams with Precision', 'https://example.com/physics-fbd.pdf', 'PDF', 'FREE', 1);

  await insertLesson.run(
    pSec1, physCourseId, physTeacher.userId,
    'Connected Bodies, Pulleys, and Tension Systems (Subscriber Only)',
    'Solving multi-mass pulley systems and friction transitions using unified system equations.',
    'https://www.youtube.com/embed/8v_g85b5B7U',
    26,
    'SUBSCRIBER_ONLY',
    0,
    2
  );

  // Course 3: Computer Science - Tariq Al-Mansoor
  const csTeacher = teacherIds.find(t => t.name.includes('Tariq'));
  const csCourseRes = await insertCourse.run(
    csTeacher.userId,
    subjectMap['computer-science'],
    'Foundational Algorithms & Data Structures in Python',
    'Learn how computers process information: Big-O analysis, arrays, linked lists, recursion, trees, and search algorithms taught cleanly.',
    'Grade 12',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80'
  );
  const csCourseId = csCourseRes.lastInsertRowid;
  const csSec1Res = await insertSection.run(csCourseId, 'Computational Complexity & Basic Structures', 1);
  const csSec1 = csSec1Res.lastInsertRowid;

  const csl1Res = await insertLesson.run(
    csSec1, csCourseId, csTeacher.userId,
    'Demystifying Big-O Time & Space Complexity (Free Sample)',
    'Learn how to measure algorithm performance without relying on machine clock speed. Understand O(1), O(log n), O(n), and O(n^2) with concrete visual benchmarks.',
    'https://www.youtube.com/embed/D6xkbGLQesk',
    22,
    'FREE',
    1,
    1
  );
  const csl1 = csl1Res.lastInsertRowid;
  await insertResource.run(csl1, 'Cheatsheet: Big-O Asymptotic Notations', 'https://example.com/big-o-cheatsheet.pdf', 'PDF', 'FREE', 1);

  await insertLesson.run(
    csSec1, csCourseId, csTeacher.userId,
    'Binary Search & Two-Pointer Strategies (Subscriber Only)',
    'Deep dive into divide-and-conquer principles and why binary search is one of the most powerful algorithms in computer science.',
    'https://www.youtube.com/embed/MFhxShGxHWc',
    28,
    'SUBSCRIBER_ONLY',
    0,
    2
  );

  // 6. Insert Simulated Subscription for Sample Student
  // Student 1 (Adam Miller) is subscribed to Dr. Jordan Reed
  const subStarted = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
  const subRenewal = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

  const insertSub = db.prepare(`
    INSERT INTO subscriptions (student_id, teacher_id, price_cents, status, started_at, renewal_at)
    VALUES (?, ?, ?, 'active', ?, ?)
  `);
  const subRes = await insertSub.run(studentIds[0], mathTeacher.userId, mathTeacher.price, subStarted, subRenewal);

  // Record simulated payment: $5 total, 20% platform ($1), $4 teacher
  const insertPayment = db.prepare(`
    INSERT INTO payments (subscription_id, student_id, teacher_id, amount_cents, platform_commission_cents, teacher_earnings_cents, status, simulated)
    VALUES (?, ?, ?, ?, ?, ?, 'completed', 1)
  `);
  await insertPayment.run(subRes.lastInsertRowid, studentIds[0], mathTeacher.userId, 500, 100, 400);

  // 7. Insert Learning Progress for Adam
  const nowIso = new Date().toISOString();
  const insertProgress = db.prepare(`
    INSERT INTO progress (student_id, course_id, lesson_id, completed, last_watched_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  // Completed lesson 1, started lesson 2
  await insertProgress.run(studentIds[0], mathCourseId, l1, 1, nowIso);
  await insertProgress.run(studentIds[0], mathCourseId, l2, 0, nowIso);

  // 8. Insert Reviews
  const insertReview = db.prepare(`
    INSERT INTO reviews (student_id, teacher_id, rating, comment)
    VALUES (?, ?, ?, ?)
  `);
  await insertReview.run(
    studentIds[0],
    mathTeacher.userId,
    5,
    'Dr. Reed is easily the best math teacher I have ever had. The way he explained derivatives cleared up months of confusion in under an hour.'
  );
  await insertReview.run(
    studentIds[1],
    physTeacher.userId,
    5,
    'Elena’s physics free-body breakdown was a game changer for my exam scores. Highly recommend subscribing!'
  );

  console.log('Korsa database seeded successfully!');
}
