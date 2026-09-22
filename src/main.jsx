import React, {useMemo, useState, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import Logo from './components/Logo';
import Button from './components/Button';
import Badge from './components/Badge';
import Icon from './components/Icon';
import PublicNav from './components/PublicNav';
import AppShell from './components/AppShell';
import PageHeader from './components/PageHeader';
import Stat from './components/Stat';
import PanelHead from './components/PanelHead';
import './styles.css';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import Protected from './components/Protected';
import MyProfile from './pages/MyProfile';
import Skills from './pages/Skills';
import SkillDetail from './pages/SkillDetail';
import Careers from './pages/Careers';
import CareerDetail from './pages/CareerDetail';
import EmployerProfile from './pages/EmployerProfile';
import JobEditor from './pages/JobEditor';
import EmployerJobs from './pages/EmployerJobs';
import JobDetailPublic from './pages/JobDetailPublic';
import AdminDashboard from './pages/AdminDashboard';
import MyApplications from './pages/MyApplications';
import ApplicantDetail from './pages/ApplicantDetail';
import EmployerRecommendations from './pages/EmployerRecommendations';
import CandidateDetailForEmployer from './pages/CandidateDetailForEmployer';
import Assessments from './pages/Assessments';
import TakeAssessment from './pages/TakeAssessment';
import AssessmentManager from './pages/AssessmentManager';
import SkillGap from './pages/SkillGap';
import LearningResources from './pages/LearningResources';
import RecommendedResources from './pages/RecommendedResources';
import MyPortfolio from './pages/MyPortfolio';
import ProjectEditor from './pages/ProjectEditor';
import PublicPortfolio from './pages/PublicPortfolio';
import { fetchPublishedJobs, readableSupabaseError } from './lib/supabaseData';
import { supabase } from './lib/supabaseClient';

const careers = [
  {title:'Software Developer', category:'Technology & ICT', match:91, icon:'⌘', skills:['JavaScript','React','Git','APIs','SQL'], color:'blue'},
  {title:'Data Analyst', category:'Data & Analytics', match:84, icon:'▥', skills:['Excel','SQL','Python','Power BI'], color:'cyan'},
  {title:'Network Administrator', category:'IT Support & Networking', match:76, icon:'⌁', skills:['Networking','Linux','Security','Cisco'], color:'purple'},
  {title:'Graphic Designer', category:'Creative & Media', match:72, icon:'✦', skills:['Photoshop','Illustrator','Branding','UI Design'], color:'pink'},
  {title:'Accountant', category:'Finance & Accounting', match:67, icon:'₿', skills:['Excel','Accounting','Tax','Reporting'], color:'orange'}
];
const jobs = [
  {id:1,title:'Frontend Developer',company:'Tech Solutions Ltd',location:'Lilongwe',type:'Full-time',skills:['React','JavaScript','Git'],match:88},
  {id:2,title:'Data Analyst Intern',company:'Data Insights Malawi',location:'Blantyre',type:'Internship',skills:['Excel','SQL','Python'],match:82},
  {id:3,title:'Graphic Designer',company:'Creative Hub MW',location:'Lilongwe',type:'Full-time',skills:['Figma','Branding','Adobe'],match:74},
  {id:4,title:'Junior Network Administrator',company:'Malawi Digital Services',location:'Mzuzu',type:'Full-time',skills:['Networking','Linux','Security'],match:69}
];
const assessments = [
  {id:1,title:'HTML & CSS Basics',category:'Web Development',questions:15,duration:'30 min',score:null},
  {id:2,title:'JavaScript Fundamentals',category:'Web Development',questions:20,duration:'45 min',score:78},
  {id:3,title:'Python Programming',category:'Programming',questions:20,duration:'60 min',score:null},
  {id:4,title:'Database Concepts',category:'Database',questions:15,duration:'30 min',score:82},
  {id:5,title:'Networking Basics',category:'Networking',questions:15,duration:'30 min',score:null}
];
const learning = [
  {title:'React Fundamentals',skill:'React',level:'Intermediate',duration:'6 hours',provider:'SkillBridge Learning',progress:28},
  {title:'Git & GitHub Essentials',skill:'Git',level:'Beginner',duration:'3 hours',provider:'SkillBridge Learning',progress:60},
  {title:'REST API Development',skill:'APIs',level:'Intermediate',duration:'5 hours',provider:'SkillBridge Learning',progress:0},
  {title:'SQL for Developers',skill:'SQL',level:'Intermediate',duration:'4 hours',provider:'SkillBridge Learning',progress:85}
];

function App(){
  const [page,setPage]=useState('home');
  const [logged,setLogged]=useState(false);
  const [toast,setToast]=useState('');
  const [applications,setApplications]=useState([]);
  const [saved,setSaved]=useState([]);
  const [assessment,setAssessment]=useState(null);
  const [profile,setProfile]=useState({name:'Blessings Chirwa',programme:'BSc Computer Science',institution:'DMI-St John the Baptist University',completion:75});
  const [theme,setTheme]=useState('light');

  useEffect(()=>{
    const pathRoutes = {'/student/dashboard':'dashboard','/graduate/dashboard':'dashboard','/employer/dashboard':'employer','/admin/dashboard':'admin'};
    const initial = window.location.hash.replace('#','') || pathRoutes[window.location.pathname];
    if(initial) setPage(initial);
    const onHashChange = ()=>{
      const h = window.location.hash.replace('#','');
      if(h) setPage(h);
    };
    window.addEventListener('hashchange', onHashChange);
    return ()=> window.removeEventListener('hashchange', onHashChange);
  },[]);
  useEffect(()=>{
    if(window.location.hash.replace('#','') !== page) window.location.hash = page;
  },[page]);

  const notify=(m)=>{setToast(m);setTimeout(()=>setToast(''),2200)};
  const go=(p)=>setPage(p);
  const {user} = useAuth();
  useEffect(()=>{ setLogged(!!user); },[user]);

  const switchRole=(r)=>{ /* role switching handled by auth role */ notify(`Switch role is available via account management`)};

  const pageContent=<>
    {page==='home'&&<Home go={go}/>} 
    {page==='about'&&<About/>}
    {page==='how'&&<HowItWorks/>}
    {page==='login'&&<Login onLogin={(u)=>{ setLogged(true); const r = u?.role || user?.role; if(r==='employer') go('employer'); else if(r==='admin') go('admin'); else go('dashboard'); notify('Welcome back'); }} go={go}/>} 
    {page==='signup'&&<Signup onSignup={(u,needsEmailConfirmation)=>{ if(needsEmailConfirmation){ setLogged(false); go('login'); notify('Account created. Check your email to confirm it before logging in.'); return; } setLogged(true); const r = u?.role || u?.user_metadata?.role || user?.role; if(r==='employer') go('employer'); else if(r==='admin') go('admin'); else go('profile'); notify('Account created — complete your profile'); }} go={go} />}
    {page==='dashboard'&&<StudentDashboard profile={profile} go={go}/>} 
    {page==='profile'&&<MyProfile/>}
    {page==='applications'&&<MyApplications/>}
    {page.startsWith('application-')&&<ApplicantDetail id={page.replace('application-','')}/>} 
    {page==='careers'&&<Careers/>} 
    {page==='careers_dir'&&<Careers/>}
    {page.startsWith('career-')&&<CareerDetail id={page.replace('career-','')}/>} 
    {page==='skills'&&<Skills/>}
    {page.startsWith('skill-')&&<SkillDetail id={page.replace('skill-','')}/>} 
    {page==='employer_profile'&&<EmployerProfile/>}
    {page.startsWith('post-job-')&&<JobEditor jobId={page.replace('post-job-','')}/>} 
    {page==='post-job'&&<JobEditor/>}
    {page==='manage-jobs'&&<EmployerJobs/>}
    {page.startsWith('job-recs-')&&<EmployerRecommendations id={page.replace('job-recs-','')}/>} 
    {page.startsWith('job-')&& !page.startsWith('job-recs-')&&<JobDetailPublic id={page.replace('job-','')}/>} 
    {page.startsWith('candidate-')&&<CandidateDetailForEmployer jobId={page.split('-')[1]} candidateId={page.split('-')[2]}/>} 
    {page==='assessments'&&<Assessments/>}
    {page.startsWith('take-')&&<TakeAssessment id={page.replace('take-','')}/>} 
    {page==='assessment-manager'&&<AssessmentManager/>}
    {page==='skill-gap'&&<SkillGap/>}
    {page==='career-guidance'&&<CareerGuidance/>}
    {page==='assessment'&&<Assessments/>} 
    {page==='my-portfolio'&&<MyPortfolio/>}
    {page==='project-new'&&<ProjectEditor/>}
    {page.startsWith('project-')&&page!=='projects'&&page!=='project-new'&&<ProjectEditor id={page.replace('project-','')}/>} 
    {page.startsWith('portfolio-')&&<PublicPortfolio id={page.replace('portfolio-','')}/>} 
    {page==='gap'&&<SkillGap/>} 
    {page==='learning'&&<LearningResources/>} 
    {page==='portfolio'&&<MyPortfolio/>} 
    {page==='jobs'&&<Jobs jobs={jobs} saved={saved} setSaved={setSaved} applications={applications} setApplications={setApplications} notify={notify}/>} 
    {page==='notifications'&&<Notifications/>}
    {page==='settings'&&<Settings theme={theme} setTheme={setTheme} notify={notify}/>} 
    {page==='employer'&&<EmployerDashboard go={go}/>} 
    {page==='company'&&<CompanyProfile notify={notify}/>} 
    {page==='candidates'&&<Candidates/>} 
    {page==='employer-apps'&&<EmployerApplications notify={notify}/>} 
    {page==='admin'&&<AdminDashboard notify={notify}/>} 
      {page==='learning-resources'&&<LearningResources/>}
      {page==='recommended-resources'&&<RecommendedResources/>}
  </>;

  const isPublic=['home','login','signup','about','how','careers_dir','jobs'].includes(page) || (page.startsWith('job-') && !page.startsWith('job-recs-')) || page.startsWith('portfolio-');
  const roleName = user?.role || null;

  const employerOnly = ['employer','company','post-job','manage-jobs','candidates','employer-apps','employer_profile'];
  const studentOnly = ['dashboard','profile','myprofile','applications','careers','skills','assessments','assessment','skill-gap','gap','learning','learning-resources','recommended-resources','portfolio','my-portfolio','notifications','settings','careers_dir'];
  const isEmployerPage = employerOnly.includes(page) || page.startsWith('post-job-') || page.startsWith('job-recs-') || page.startsWith('candidate-');
  const allowedRolesForPage = isPublic ? null : (page==='admin' ? ['admin'] : (isEmployerPage ? ['employer'] : (studentOnly.includes(page) ? ['student','graduate'] : ['student','graduate','employer'])));

  const guardedContent = isPublic ? pageContent : <Protected allowedRoles={allowedRolesForPage}>{pageContent}</Protected>;

  return <div className={theme==='dark'?'app dark':'app'}>
    {isPublic ? <PublicNav page={page} go={go} logged={logged} role={roleName} switchRole={switchRole} theme={theme} setTheme={setTheme}/> : <AppShell role={roleName} page={page} go={go} switchRole={switchRole} theme={theme} setTheme={setTheme}>{guardedContent}</AppShell>}
    {isPublic && <main>{pageContent}</main>}
    {toast&&<div className="toast">✓ {toast}</div>}
  </div>
}

function Home({go}){return <div className="landing"><section className="hero"><div className="hero-copy"><Badge tone="soft">AI-powered career platform for Malawi</Badge><h1>Bridge Your Skills<br/>to a <span>Brighter Future.</span></h1><p>Get personalized career guidance, assess your skills, fill knowledge gaps and connect with real employment opportunities in Malawi.</p><div className="hero-actions"><Button onClick={()=>go('signup')}>Get Started →</Button><Button variant="outline" onClick={()=>go('how')}>Learn More</Button></div><div className="hero-stats"><div><b>25K+</b><span>Career-ready users</span></div><div><b>300+</b><span>Verified resources</span></div><div><b>120+</b><span>Partner roles</span></div></div></div><div className="hero-visual"><div className="glow"></div><div className="student-illustration"><div className="person-head"></div><div className="person-body"></div><div className="laptop"></div></div><div className="floating-card"><b>AI career match</b><strong>91%</strong><span>Software Developer</span></div></div></section><section className="feature-grid">{[['⌁','Career Guidance','Discover careers that match your interests and skills.'],['✓','Skills Assessment','Test and verify your competencies.'],['▤','Learning Resources','Get recommendations to close your skills gaps.'],['♢','Job Matching','Find the right job or internship.']].map(x=><div className="feature" key={x[1]}><div className="feature-icon">{x[0]}</div><h3>{x[1]}</h3><p>{x[2]}</p></div>)}</section><section className="section"><div className="section-head"><div><span className="eyebrow">Explore your path</span><h2>Popular Careers</h2></div><button onClick={()=>go('careers')}>View all careers →</button></div><div className="career-row">{careers.slice(0,4).map(c=><CareerMini c={c} key={c.title}/>)}</div></section></div>}
function CareerMini({c}){return <div className="career-mini"><div className={'mini-icon '+c.color}>{c.icon}</div><div><b>{c.title}</b><span>{c.category}</span></div></div>}
function About(){return <div className="public-page"><Badge tone="soft">About SkillBridge Malawi</Badge><h1>Bridging Skills, Careers and Employment.</h1><p>SkillBridge Malawi connects students and graduates to career guidance, skills assessment, learning resources, professional portfolios and employment opportunities through one platform.</p><div className="about-cards"><div><b>Discover</b><span>Personalized career recommendations.</span></div><div><b>Assess</b><span>Evidence-based skills assessment.</span></div><div><b>Improve</b><span>Learning recommendations for skill gaps.</span></div><div><b>Match</b><span>Explainable job and candidate matching.</span></div></div></div>}
function HowItWorks(){return <div className="public-page"><Badge tone="soft">How it works</Badge><h1>From learning to opportunity.</h1><div className="steps">{[['01','Discover','Complete your profile and receive career recommendations.'],['02','Assess','Take skill assessments and understand your current competency.'],['03','Improve','See your skill gaps and receive relevant learning resources.'],['04','Showcase','Build a portfolio with projects, certificates and evidence.'],['05','Match','Find jobs and internships matched to your profile.']].map(s=><div className="step" key={s[0]}><b>{s[0]}</b><h3>{s[1]}</h3><p>{s[2]}</p></div>)}</div></div>}
function Login({onLogin,go}){
  const { login, resetPassword } = useAuth();
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [error,setError] = useState(null);

  const handleSubmit = async (e)=>{
    e.preventDefault(); setError(null);
    const r = await login(email,password);
    if(r.ok){ onLogin(r.user); } else setError(r.error || 'Login failed');
  };

  const handleReset = async ()=>{
    if(!email){ setError('Enter your email address first'); return; }
    const result = await resetPassword(email);
    setError(result.ok ? 'Check your email for a password reset link.' : result.error);
  };

  return <div className="auth-page"><div className="auth-brand"><Logo/><div className="auth-slogan"><h2>Your skills. Our platform.<br/><span>A brighter future.</span></h2><div className="orbit">⌃</div></div></div>
    <form className="auth-card" onSubmit={handleSubmit}>
      <h1>Welcome Back!</h1>
      <p>Log in to your account to continue.</p>
      {error&&<div className="error">{error}</div>}
      <label>Email address<input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Enter your email" required/></label>
      <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Enter your password" required/></label>
      <div className="row-between"><label className="check"><input type="checkbox"/> Remember me</label><a onClick={handleReset}>Forgot password?</a></div>
      <Button type="submit">Login</Button>
      <small>Don't have an account? <a onClick={()=>go('signup')}>Create one</a></small>
    </form>
  </div>;
}
function Signup({onSignup,go}){
  const { register } = useAuth();
  const [fullName,setFullName] = useState('');
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [confirm,setConfirm] = useState('');
  const [accountType,setAccountType] = useState('student');
  const [institution,setInstitution] = useState('');
  const [programme,setProgramme] = useState('');
  const [careerInterests,setCareerInterests] = useState('');
  const [companyName,setCompanyName] = useState('');
  const [companyType,setCompanyType] = useState('');
  const [accept,setAccept] = useState(false);
  const [error,setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if(password !== confirm){ setError('Passwords do not match'); return; }
    const r = await register({ fullName, email, password, accountType, acceptTerms: accept, institution, programme, careerInterests: careerInterests.split(',').map(item=>item.trim()).filter(Boolean), companyName, companyType });
    if(r.ok){ onSignup && onSignup(r.user, r.needsEmailConfirmation); } else setError(r.error || 'Registration failed');
  };

  return (
    <div className="auth-page">
      <div className="auth-brand"><Logo/>
        <div className="auth-slogan"><h2>Take the next step<br/><span>in your career journey.</span></h2><div className="orbit">⌃</div></div>
      </div>
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create Your Account</h1>
        <p>Join SkillBridge Malawi and build a stronger career profile.</p>
        <div className="progress"><b>1</b><i></i><b>2</b><i></i><b>3</b></div>
        <label>I am registering as</label>
        <div className="role-options">
          <label><input type="radio" name="role" checked={accountType==='student'} onChange={()=>setAccountType('student')}/> Student</label>
          <label><input type="radio" name="role" checked={accountType==='graduate'} onChange={()=>setAccountType('graduate')}/> Graduate</label>
          <label><input type="radio" name="role" checked={accountType==='employer'} onChange={()=>setAccountType('employer')}/> Employer</label>
        </div>
        {error && <div className="error">{error}</div>}
        <label>Full name<input value={fullName} onChange={e=>setFullName(e.target.value)} required placeholder="Enter your full name"/></label>
        <label>Email address<input value={email} onChange={e=>setEmail(e.target.value)} required type="email" placeholder="Enter your email"/></label>
        <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} required type="password" placeholder="Create a password"/></label>
        <label>Confirm password<input value={confirm} onChange={e=>setConfirm(e.target.value)} required type="password" placeholder="Confirm password"/></label>
        {accountType === 'employer' ? <>
          <label>Company name<input value={companyName} onChange={e=>setCompanyName(e.target.value)} required placeholder="Enter your company name"/></label>
          <label>Company type / industry<input value={companyType} onChange={e=>setCompanyType(e.target.value)} required placeholder="e.g. Technology & ICT"/></label>
        </> : <>
          <label>Institution<input value={institution} onChange={e=>setInstitution(e.target.value)} placeholder="Enter your institution"/></label>
          <label>Programme<input value={programme} onChange={e=>setProgramme(e.target.value)} placeholder="e.g. BSc Computer Science"/></label>
          <label>Career interests<input value={careerInterests} onChange={e=>setCareerInterests(e.target.value)} placeholder="e.g. Software, Data, Design"/></label>
        </>}
        <label className="check"><input type="checkbox" checked={accept} onChange={e=>setAccept(e.target.checked)}/> I accept the terms</label>
        <Button type="submit">Next →</Button>
        <small>Already have an account? <a onClick={()=>go('login')}>Log in</a></small>
      </form>
    </div>
  );
}

function StudentDashboard({profile,go}){return <><PageHeader eyebrow="Student dashboard" title={`Welcome back, ${profile.name.split(' ')[0]}!`} description="Keep building your skills. Your future is bright." action={<Button onClick={()=>go('profile')}>Complete profile</Button>}/><div className="stats"><Stat icon="◉" label="Profile Completion" value={profile.completion+'%'} progress={profile.completion}/><Stat icon="✓" label="Skills Assessed" value="5"/><Stat icon="▤" label="Learning Resources" value="2"/><Stat icon="⌁" label="Career Matches" value="8"/></div><div className="dashboard-grid"><div className="panel"><PanelHead title="Recommended Careers" link="View all" onClick={()=>go('careers_dir')}/><div className="career-list">{careers.slice(0,4).map(c=><div className="career-item" key={c.title}><div className={'mini-icon '+c.color}>{c.icon}</div><div><b>{c.title}</b><span>{c.category}</span></div><strong>{c.match}% <small>match</small></strong><button onClick={()=>go('skill-gap')}>View details →</button></div>)}</div></div><div className="panel quick"><PanelHead title="Quick Actions"/><Button variant="soft" onClick={()=>go('assessments')}>✓ Take Skills Assessment</Button><Button variant="soft" onClick={()=>go('careers_dir')}>⌁ View Career Recommendations</Button><Button variant="soft" onClick={()=>go('learning-resources')}>▤ Explore Learning Resources</Button><Button variant="soft" onClick={()=>go('profile')}>◉ Update Profile</Button></div></div><div className="panel"><PanelHead title="Recent jobs" link="View all" onClick={()=>go('jobs')}/><JobRows jobs={jobs.slice(0,3)} compact go={go}/></div></>}

function Profile({profile,setProfile,notify}){return <><PageHeader eyebrow="My profile" title="Build your professional profile" description="A complete profile improves career and job recommendations."/><div className="profile-layout"><div className="profile-main panel"><div className="profile-cover"></div><div className="profile-top"><div className="avatar xl">BC</div><div><h2>{profile.name}</h2><p>{profile.programme} · {profile.institution}</p><Badge tone="success">Profile 75% complete</Badge></div><Button variant="outline" onClick={()=>notify('Profile saved')}>Save changes</Button></div><div className="form-grid"><label>Full name<input value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})}/></label><label>Programme<input value={profile.programme} onChange={e=>setProfile({...profile,programme:e.target.value})}/></label><label>Institution<input value={profile.institution} onChange={e=>setProfile({...profile,institution:e.target.value})}/></label><label>Study level<select><option>Third Year</option><option>Final Year</option><option>Graduate</option></select></label><label>Location<select><option>Lilongwe</option><option>Blantyre</option><option>Mzuzu</option></select></label><label>Career interest<select><option>Software Development</option><option>Data Analytics</option><option>Networking</option></select></label></div><div className="profile-section"><h3>Skills</h3><div className="chips">{['HTML','CSS','JavaScript','React','Git','SQL','UI Design'].map((s,i)=><span key={s}>{s}<small>{i%3===0?'Verified':'Self-declared'}</small></span>)}</div></div></div><aside className="profile-side panel"><h3>Profile strength</h3><div className="ring">75%</div><p>Complete these items to improve your recommendations.</p><ul><li>✓ Education</li><li>✓ Skills</li><li>✓ Projects</li><li>○ Add certificates</li><li>○ Add work experience</li></ul></aside></div></>}

function CareerGuidance({go}){const [tab,setTab]=useState('recommended'); return <><PageHeader eyebrow="Career guidance" title="Discover careers that fit you" description="AI-generated recommendations based on your programme, skills, interests and preferences."/><div className="tabs"><button className={tab==='recommended'?'active':''} onClick={()=>setTab('recommended')}>Recommended Careers</button><button className={tab==='all'?'active':''} onClick={()=>setTab('all')}>Explore All</button><button className={tab==='interests'?'active':''} onClick={()=>setTab('interests')}>My Interests</button></div><div className="career-layout"><div className="panel career-results">{(tab==='all'?[...careers,...careers]:careers).map(c=><div className="career-card" key={c.title+Math.random()}><div className={'mini-icon '+c.color}>{c.icon}</div><div className="career-card-main"><div><h3>{c.title}</h3><p>{c.category}</p></div><strong>{c.match}% <span>match</span></strong><div className="matchbar"><i style={{width:c.match+'%'}}></i></div><div className="tags">{c.skills.slice(0,4).map(s=><span key={s}>{s}</span>)}</div><button onClick={()=>go('gap')}>View career details →</button></div></div>)}</div><div className="panel why"><h3>Why these careers?</h3><p>Based on your profile:</p><ul><li>✓ Computer Science programme</li><li>✓ Programming skills</li><li>✓ Interest in technology</li><li>✓ Good problem-solving skills</li></ul><div className="ai-note">✦ AI-generated recommendations should be reviewed by you and are not guarantees of career outcomes.</div></div></div></>}

function AssessmentPage({assessment,setAssessment,notify}){const [running,setRunning]=useState(false); const [q,setQ]=useState(1); const current=assessment||assessments[0]; if(running)return <AssessmentRun assessment={current} q={q} setQ={setQ} finish={()=>{setRunning(false);notify('Assessment submitted — result: 86%');}}/>; return <><PageHeader eyebrow="Skills assessment" title="Test and verify your skills" description="Complete assessments to strengthen your competency profile."/><div className="assessment-tabs"><Badge tone="blue">Available assessments</Badge><span>My results</span><select><option>All categories</option><option>Web Development</option><option>Programming</option></select></div><div className="assessment-list">{assessments.map(a=><div className="assessment-card" key={a.id}><div className="assessment-icon">{a.id===1?'◈':a.id===2?'JS':a.id===3?'Py':a.id===4?'DB':'⌁'}</div><div><h3>{a.title}</h3><p>{a.category} · {a.questions} questions · {a.duration}</p></div>{a.score?<Badge tone="success">{a.score}% completed</Badge>:<Button onClick={()=>{setAssessment(a);setRunning(true)}}>{a.id===4?'Retake':'Start'} →</Button>}</div>)}</div></>}
function AssessmentRun({assessment,q,setQ,finish}){const [selected,setSelected]=useState(null);return <div className="assessment-run"><div className="assessment-top"><Badge tone="soft">{assessment.title}</Badge><span>Question {q} of 10</span></div><div className="question-card"><div className="q-progress"><i style={{width:q*10+'%'}}></i></div><h1>Which technology is commonly used to style the presentation of a web page?</h1><div className="options">{['JavaScript','HTML','CSS','SQL'].map((x,i)=><button key={x} className={selected===i?'chosen':''} onClick={()=>setSelected(i)}><b>{String.fromCharCode(65+i)}</b>{x}</button>)}</div><div className="question-actions"><Button variant="outline" onClick={()=>setQ(Math.max(1,q-1))}>← Previous</Button>{q<10?<Button onClick={()=>{if(selected===null)return;setSelected(null);setQ(q+1)}}>Next →</Button>:<Button onClick={finish} disabled={selected===null}>Submit Assessment</Button>}</div></div></div>}

function SkillsGap({go}){const gap=[['React',70,32],['Git',70,44],['REST APIs',65,28],['SQL',60,67],['JavaScript',75,82]];return <><PageHeader eyebrow="Skills gap analysis" title="Understand what to improve" description="Compare your current competency with the requirements of your target career." action={<select className="career-select"><option>Software Developer</option><option>Data Analyst</option></select>}/><div className="gap-overview"><div className="panel"><h3>Career readiness</h3><div className="big-score">62<span>/100</span></div><p>There are 3 priority skills to develop for this career.</p><Button onClick={()=>go('learning')}>View learning recommendations →</Button></div><div className="panel"><h3>Skill comparison</h3>{gap.map(([s,r,c])=><div className="skill-row" key={s}><div><b>{s}</b><span>{c}% current · {r}% required</span></div><div className="double"><i style={{width:r+'%'}}></i><em style={{width:c+'%'}}></em></div><strong>{Math.max(r-c,0)}% gap</strong></div>)}</div></div><div className="panel"><PanelHead title="Priority development areas"/><div className="priority-grid">{gap.filter(x=>x[2]<x[1]).slice(0,3).map(x=><div key={x[0]}><Badge tone="warning">Priority</Badge><h3>{x[0]}</h3><p>Develop from {x[2]}% to {x[1]}%.</p><button onClick={()=>go('learning')}>Find resources →</button></div>)}</div></div></>}

function Learning({notify}){return <><PageHeader eyebrow="Learning resources" title="Close your skills gaps" description="Recommended resources are based on your target career and assessment results."/><div className="learning-grid">{learning.map(l=><div className="learning-card" key={l.title}><div className="learning-top"><div className="course-icon">▤</div><Badge tone="soft">{l.level}</Badge></div><h3>{l.title}</h3><p>{l.skill} · {l.duration} · {l.provider}</p><div className="progress-label"><span>{l.progress}% complete</span><span>{l.progress? 'Continue':'Start learning'}</span></div><div className="progress-bar"><i style={{width:l.progress+'%'}}></i></div><Button variant={l.progress?'outline':'primary'} onClick={()=>notify(l.progress?'Opening course…':'Learning resource added')}>{l.progress?'Continue':'Start'} →</Button></div>)}</div></>}

function Portfolio({notify}){const projects=[['SkillBridge Malawi','AI-powered career and employment platform','React · TypeScript · Supabase'],['Malawi Expense Tracker','Personal finance management web app','Next.js · PostgreSQL'],['DMI Student Portal','Academic information prototype','React · Tailwind CSS']];return <><PageHeader eyebrow="My portfolio" title="Showcase what you can do" description="Give employers evidence of your practical abilities." action={<Button onClick={()=>notify('Project form opened')}>＋ Add Project</Button>}/><div className="portfolio-head panel"><div className="avatar xl">BC</div><div><h2>Blessings Chirwa</h2><p>Computer Science · Lilongwe, Malawi</p><div className="chips"><span>JavaScript</span><span>React</span><span>UI Design</span><span>SQL</span></div></div><Badge tone="success">Public portfolio</Badge></div><div className="project-grid">{projects.map(p=><div className="project-card" key={p[0]}><div className="project-cover"><span>▦</span></div><div><Badge tone="soft">Project</Badge><h3>{p[0]}</h3><p>{p[1]}</p><small>{p[2]}</small><button onClick={()=>notify('Project details opened')}>View project →</button></div></div>)}</div></>}

function Jobs({notify}){
  const [items,setItems]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(null); const [search,setSearch]=useState(''); const [employmentType,setEmploymentType]=useState('');
  const loadJobs=async()=>{ setLoading(true); const { data, error: queryError }=await fetchPublishedJobs({search,employmentType}); if(queryError) setError(readableSupabaseError(queryError,'Unable to load jobs.')); else setItems(data||[]); setLoading(false); };
  useEffect(()=>{ const timer=setTimeout(loadJobs,250); return()=>clearTimeout(timer); },[search,employmentType]);
  const saveJob=async(id)=>{ const { data:{user} }=await supabase.auth.getUser(); if(!user){ notify('Please log in to save a job'); window.location.hash='login'; return; } const { error: saveError }=await supabase.from('saved_jobs').upsert({user_id:user.id,job_id:id}); notify(saveError?readableSupabaseError(saveError,'Unable to save this job.'):'Job saved'); };
  return <><PageHeader eyebrow="Jobs & internships" title="Find your next opportunity" description="Explore opportunities that match your skills and career interests."/><div className="jobs-filter"><input placeholder="Search jobs, skills, companies..." value={search} onChange={e=>setSearch(e.target.value)}/><select value={employmentType} onChange={e=>setEmploymentType(e.target.value)}><option value="">All types</option><option value="full_time">Full-time</option><option value="part_time">Part-time</option><option value="internship">Internship</option><option value="contract">Contract</option><option value="remote">Remote</option></select></div><div className="job-layout"><div className="job-results">{loading?<div className="panel">Loading jobs…</div>:error?<div className="panel error">{error}</div>:items.length?items.map(j=><div className="job-card panel" key={j.id}><div className="company-icon">{j.employer_profiles?.company_name?.slice(0,1)||'J'}</div><div className="job-main"><div className="job-title"><div><h3>{j.title}</h3><p>{j.employer_profiles?.company_name||'Employer'} · {j.location_text||'Malawi'} · {j.employment_type}</p></div></div><div className="tags">{j.job_skills?.map(({skills:s})=><span key={s.id}>{s.name}</span>)}</div><div className="job-actions"><Button onClick={()=>window.location.hash='job-'+j.id}>View job</Button><button className="save" onClick={()=>saveJob(j.id)}>♡ Save job</button></div></div></div>):<div className="panel empty">No jobs found</div>}</div><aside className="panel match-tip"><h3>AI match insights</h3><p>Matching results will appear here when the recommendation service stores them in Supabase.</p></aside></div></>}

function JobRows({jobs,compact=false,go}){return <div className="job-rows">{jobs.map(j=><div className="job-row" key={j.id}><div className="company-icon sm">{j.company[0]}</div><div><b>{j.title}</b><span>{j.company} · {j.location} · {j.type}</span></div><Badge tone="success">{j.match}%</Badge><Button variant="outline" onClick={()=>go&&go('jobs')}>{compact?'Apply':'View'}</Button></div>)} </div>}

function Applications({applications}){const applied=jobs.filter(j=>applications.includes(j.id));return <><PageHeader eyebrow="My applications" title="Track your applications" description="Keep up with every opportunity you have applied for."/><div className="panel"><div className="application-table"><div className="table-head"><span>Position</span><span>Company</span><span>Match</span><span>Status</span></div>{(applied.length?applied:jobs.slice(0,2)).map(j=><div className="table-row" key={j.id}><span><b>{j.title}</b><small>{j.type}</small></span><span>{j.company}</span><span>{j.match}%</span><Badge tone={applied.length?'success':'soft'}>{applied.length?'Submitted':'Example'}</Badge></div>)}</div></div></>}

function Notifications(){return <><PageHeader eyebrow="Notifications" title="Stay up to date"/><div className="notification-list">{['Your JavaScript assessment result is ready.','A new job matches 88% of your profile.','Complete your portfolio by adding one more project.','Your profile was viewed by Tech Solutions Ltd.'].map((n,i)=><div className="notification panel" key={n}><div className="notice-dot">●</div><div><b>{n}</b><p>{i+1} hour{i?'s':''} ago</p></div></div>)} </div></>}

function Settings({theme,setTheme,notify}){return <><PageHeader eyebrow="Settings" title="Account settings"/><div className="settings-grid"><div className="panel"><h3>Appearance</h3><p>Choose how SkillBridge looks for you.</p><div className="setting-row"><span>Dark mode</span><button className={'toggle '+(theme==='dark'?'on':'')} onClick={()=>setTheme(theme==='light'?'dark':'light')}><i></i></button></div></div><div className="panel"><h3>Notifications</h3><div className="setting-row"><span>Job recommendations</span><input type="checkbox" defaultChecked/></div><div className="setting-row"><span>Application updates</span><input type="checkbox" defaultChecked/></div><div className="setting-row"><span>Learning reminders</span><input type="checkbox"/></div></div><div className="panel"><h3>Privacy</h3><p>Your AI recommendations use your profile and assessment information to provide decision-support. They do not guarantee career or employment outcomes.</p><Button variant="outline" onClick={()=>notify('Privacy settings saved')}>Save settings</Button></div></div></>}

function EmployerDashboard({go}){return <><PageHeader eyebrow="Employer dashboard" title="Review applicants, post roles and match talent faster." description="Manage company profiles, publish jobs and internships, and review candidates using skills, portfolio evidence and academic background." action={<Button onClick={()=>go('post-job')}>Post a job →</Button>}/><div className="stats"><Stat icon="▤" label="Active Jobs" value="6"/><Stat icon="□" label="Applications" value="84"/><Stat icon="♢" label="Recommended Candidates" value="27"/><Stat icon="✓" label="Shortlisted" value="12"/></div><div className="dashboard-grid"><div className="panel"><PanelHead title="Example AI candidate match"/><div className="candidate-match"><div className="big-score">85<span>%</span></div><div><h3>Career fit</h3><p>Strong matches: relevant coursework, verified skills, academic qualification and portfolio evidence.</p><div className="tags"><span>JavaScript</span><span>React</span><span>SQL</span></div></div></div></div><div className="panel quick"><PanelHead title="Quick Actions"/><Button variant="soft" onClick={()=>go('post-job')}>＋ Post a Job</Button><Button variant="soft" onClick={()=>go('candidates')}>♢ Find Candidates</Button><Button variant="soft" onClick={()=>go('employer-apps')}>□ Review Applications</Button></div></div><div className="panel"><PanelHead title="Recent applications"/><EmployerRows go={go}/></div></>}

function EmployerRows({go}){return <div className="job-rows">{['Blessings Chirwa','Chisomo Mbewe','Tapiwa Banda'].map((n,i)=><div className="job-row" key={n}><div className="avatar sm">{n.split(' ').map(x=>x[0]).join('')}</div><div><b>{n}</b><span>{['Frontend Developer','Data Analyst Intern','Graphic Designer'][i]}</span></div><Badge tone="success">{[91,86,79][i]}% match</Badge><Button variant="outline" onClick={()=>go('employer-apps')}>Review</Button></div>)} </div>}

function CompanyProfile({notify}){return <><PageHeader eyebrow="Company profile" title="Tech Solutions Ltd" description="Keep your employer profile complete and credible." action={<Button onClick={()=>notify('Company profile saved')}>Save changes</Button>}/><div className="panel company-profile"><div className="company-banner"><div className="company-logo">TS</div><div><h2>Tech Solutions Ltd</h2><p>Technology & ICT · Lilongwe, Malawi</p><Badge tone="success">Verified employer</Badge></div></div><div className="form-grid"><label>Company name<input defaultValue="Tech Solutions Ltd"/></label><label>Industry<select><option>Technology & ICT</option><option>Finance</option><option>Creative</option></select></label><label>Location<input defaultValue="Lilongwe, Malawi"/></label><label>Website<input placeholder="https://example.com"/></label></div></div></>}

function PostJob({notify}){return <><PageHeader eyebrow="Create opportunity" title="Post a job or internship" description="Define the skills and qualifications that matter for the role."/><form className="panel job-form" onSubmit={e=>{e.preventDefault();notify('Job submitted for approval')}}><div className="form-grid"><label>Job title<input required placeholder="e.g. Frontend Developer"/></label><label>Type<select><option>Full-time</option><option>Internship</option><option>Part-time</option></select></label><label>Location<select><option>Lilongwe</option><option>Blantyre</option><option>Mzuzu</option><option>Remote</option></select></label><label>Deadline<input type="date"/></label></div><label>Job description<textarea rows="6" placeholder="Describe the role, responsibilities and expectations..."></textarea></label><label>Required skills<input placeholder="React, JavaScript, Git, SQL"/></label><div className="form-actions"><Button variant="outline">Save draft</Button><Button type="submit">Publish job →</Button></div></form></>}

function ManageJobs({notify}){return <><PageHeader eyebrow="Manage jobs" title="Your opportunities" action={<Button onClick={()=>notify('Open post job')}>＋ Post a job</Button>}/><div className="panel"><div className="application-table"><div className="table-head"><span>Job</span><span>Type</span><span>Location</span><span>Status</span></div>{jobs.map(j=><div className="table-row" key={j.id}><span><b>{j.title}</b><small>{j.company}</small></span><span>{j.type}</span><span>{j.location}</span><Badge tone="success">Published</Badge></div>)}</div></div></>}

function Candidates({go}){return <><PageHeader eyebrow="Recommended candidates" title="Find candidates by skills" description="AI recommendations are decision-support and should be reviewed by hiring teams."/><div className="candidate-grid">{['Blessings Chirwa','Chisomo Mbewe','Tapiwa Banda','Mary Phiri','John Tembo','Grace Zulu'].map((n,i)=><div className="candidate-card panel" key={n}><div className="avatar lg">{n.split(' ').map(x=>x[0]).join('')}</div><div className="candidate-info"><h3>{n}</h3><p>{['BSc Computer Science','BSc Data Science','Diploma in ICT'][i%3]}</p><div className="candidate-score">{[91,86,83,79,76,72][i]}% <span>match</span></div><div className="tags"><span>{['React','SQL','Git'][i%3]}</span><span>{['JavaScript','Python','Figma'][i%3]}</span></div><button onClick={()=>go('employer-apps')}>View profile →</button></div></div>)} </div></>}

function EmployerApplications({notify}){return <><PageHeader eyebrow="Applications" title="Review applicants"/><div className="panel"><div className="application-table"><div className="table-head"><span>Candidate</span><span>Role</span><span>Match</span><span>Action</span></div>{['Blessings Chirwa','Chisomo Mbewe','Tapiwa Banda','Mary Phiri'].map((n,i)=><div className="table-row" key={n}><span><b>{n}</b><small>Verified skills available</small></span><span>{jobs[i%jobs.length].title}</span><span>{91-i*5}%</span><Button variant="outline" onClick={()=>notify('Application opened')}>Review</Button></div>)}</div></div></>}

// AdminDashboard is provided in src/pages/AdminDashboard.jsx

createRoot(document.getElementById('root')).render(<AuthProvider><App/></AuthProvider>);
