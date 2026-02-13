import { useEffect, useRef, useState } from 'react';
import { 
  Github, 
  Twitter, 
  MessageCircle, 
  Check, 
  Users, 
  Video, 
  FileText, 
  Zap,
  Shield,
  BarChart3,
  Layers,
  ArrowRight,
  Lock,
  Globe,
  Cpu,
  Database,
  ChevronRight
} from 'lucide-react';

// Navigation Component
function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#05060B]/80 backdrop-blur-xl border-b border-white/5' : ''}`}>
      <div className="flex items-center justify-between px-6 lg:px-12 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#39FF14] flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-[#05060B]" />
          </div>
          <span className="text-xl font-semibold text-[#F4F6FA]">Nexus</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="nav-link text-sm">Product</a>
          <a href="#architecture" className="nav-link text-sm">Solutions</a>
          <a href="#security" className="nav-link text-sm">Security</a>
          <a href="#pricing" className="nav-link text-sm">Pricing</a>
          <a href="#docs" className="nav-link text-sm">Docs</a>
        </div>
        
        <button className="btn-primary px-5 py-2 text-sm font-medium">
          Get Nexus
        </button>
      </div>
    </nav>
  );
}

// Hero Section
function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <section ref={sectionRef} className="section-pinned bg-[#05060B]">
      <img src="/images/hero_bg.jpg" alt="" className="bg-image" />
      <div className="bg-overlay" />
      
      <div className="relative z-10 h-full flex items-center">
        <div className="w-full px-6 lg:px-12 py-20">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* Login Card */}
            <div className="glass-panel w-full max-w-md p-8 animate-fade-in-left">
              <h2 className="text-2xl font-semibold text-[#F4F6FA] mb-6">Welcome back</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="mono-label text-[#A7ACB8] mb-2 block">Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-input w-full px-4 py-3 text-[#F4F6FA]"
                    placeholder="you@company.com"
                  />
                </div>
                
                <div>
                  <label className="mono-label text-[#A7ACB8] mb-2 block">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glass-input w-full px-4 py-3 text-[#F4F6FA]"
                    placeholder="••••••••"
                  />
                </div>
                
                <button className="btn-primary w-full py-3 text-sm font-semibold mt-2">
                  Log in
                </button>
                
                <button className="btn-secondary w-full py-3 text-sm font-medium flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
                
                <div className="flex items-center justify-between text-sm">
                  <a href="#" className="text-[#39FF14] hover:underline">Forgot password?</a>
                  <a href="#" className="text-[#A7ACB8] hover:text-[#F4F6FA]">Create an account</a>
                </div>
              </div>
            </div>
            
            {/* Hero Content */}
            <div className="flex-1 max-w-xl text-center lg:text-left animate-fade-in-right">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#F4F6FA] leading-tight mb-6">
                Real-time teamwork,{' '}
                <span className="text-[#39FF14]">built for speed.</span>
              </h1>
              
              <p className="text-lg text-[#A7ACB8] mb-8 leading-relaxed">
                Chat, voice, video, and docs—unified in one workspace. 
                No tab switching. No friction.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button className="btn-primary px-8 py-4 text-base font-semibold flex items-center justify-center gap-2">
                  Start for free
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button className="btn-secondary px-8 py-4 text-base font-medium">
                  Request a demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Info */}
      <div className="absolute bottom-6 left-6 right-6 z-10 flex items-center justify-between">
        <span className="mono-label text-[#A7ACB8]">NEXUS PLATFORM / v2.4</span>
        <span className="mono-label text-[#A7ACB8] hidden sm:block">Scroll to explore</span>
        <div className="flex items-center gap-4">
          <Github className="w-5 h-5 text-[#A7ACB8] hover:text-[#F4F6FA] cursor-pointer transition-colors" />
          <Twitter className="w-5 h-5 text-[#A7ACB8] hover:text-[#F4F6FA] cursor-pointer transition-colors" />
          <MessageCircle className="w-5 h-5 text-[#A7ACB8] hover:text-[#F4F6FA] cursor-pointer transition-colors" />
        </div>
      </div>
    </section>
  );
}

// Threads Section
function ThreadsSection() {
  return (
    <section className="section-pinned bg-[#05060B]">
      <img src="/images/threads_bg.jpg" alt="" className="bg-image" />
      <div className="bg-overlay" />
      
      <div className="relative z-10 h-full flex items-center justify-center p-6">
        <div className="glass-panel w-full max-w-5xl h-[70vh] flex flex-col md:flex-row overflow-hidden animate-scale-in">
          {/* Thread List */}
          <div className="w-full md:w-[28%] border-b md:border-b-0 md:border-r border-white/10 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#F4F6FA]">Threads</h3>
              <span className="px-2 py-1 bg-[#39FF14] text-[#05060B] text-xs font-bold rounded-full">NEW</span>
            </div>
            <div className="space-y-2">
              {['Product Spec', 'Design Review', 'Sprint Planning', 'Bug Triage'].map((thread, i) => (
                <div key={i} className={`p-3 rounded-lg cursor-pointer transition-colors ${i === 0 ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                  <p className="text-sm text-[#F4F6FA] font-medium">#{thread.toLowerCase().replace(' ', '-')}</p>
                  <p className="text-xs text-[#A7ACB8] mt-1">{12 - i} new messages</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Chat Area */}
          <div className="flex-1 flex flex-col p-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-[#F4F6FA]">Threads that stay organized</h2>
              <p className="text-sm text-[#A7ACB8] mt-1">
                Keep discussions on-topic. Reply in threads, tag what matters, and find context instantly.
              </p>
            </div>
            
            <div className="flex-1 space-y-3 overflow-auto">
              <div className="chat-bubble">
                <p className="text-sm">
                  <span className="text-[#39FF14] font-medium">Sarah Chen:</span>{' '}
                  <span className="text-[#F4F6FA]">Has anyone reviewed the latest specs?</span>
                </p>
              </div>
              <div className="chat-bubble ml-8">
                <p className="text-sm">
                  <span className="text-[#39FF14] font-medium">You:</span>{' '}
                  <span className="text-[#F4F6FA]">Yes—left comments in Figma. Two blockers flagged.</span>
                </p>
              </div>
              <div className="chat-bubble">
                <p className="text-sm">
                  <span className="text-[#39FF14] font-medium">Sarah Chen:</span>{' '}
                  <span className="text-[#F4F6FA]">Perfect. Let's resolve before tomorrow's sync.</span>
                </p>
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-2">
              <input 
                type="text" 
                className="glass-input flex-1 px-4 py-2 text-sm text-[#F4F6FA]"
                placeholder="Send a message..."
              />
              <button className="btn-primary px-4 py-2">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Participants */}
          <div className="w-full md:w-[26%] border-t md:border-t-0 md:border-l border-white/10 p-4">
            <h3 className="font-semibold text-[#F4F6FA] mb-4">Participants</h3>
            <div className="space-y-3">
              {[
                { name: 'Sarah Chen', status: 'online' },
                { name: 'You', status: 'online' },
                { name: 'Marcus Reid', status: 'away' },
                { name: 'Lina Park', status: 'offline' },
              ].map((user, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#39FF14]/30 to-[#39FF14]/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-[#39FF14]">{user.name[0]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#F4F6FA]">{user.name}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${user.status === 'online' ? 'bg-[#39FF14]' : user.status === 'away' ? 'bg-yellow-500' : 'bg-[#A7ACB8]'}`} />
                </div>
              ))}
            </div>
            <a href="#" className="text-[#39FF14] text-sm mt-4 block hover:underline">View full member list</a>
          </div>
        </div>
      </div>
    </section>
  );
}

// Video Section
function VideoSection() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <section className="section-pinned bg-[#05060B]">
      <img src="/images/video_bg.jpg" alt="" className="bg-image" />
      <div className="bg-overlay" />
      
      <div className="relative z-10 h-full flex items-center justify-center p-6">
        <div className="glass-panel w-full max-w-5xl h-[70vh] flex flex-col md:flex-row overflow-hidden">
          {/* Video Area */}
          <div className="flex-1 p-4 flex flex-col">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-[#F4F6FA]">Video that feels natural</h2>
              <p className="text-sm text-[#A7ACB8] mt-1">
                Join calls in one click. Share your screen, take notes, and keep the team aligned.
              </p>
            </div>
            
            <div className="flex-1 bg-black/40 rounded-xl flex items-center justify-center relative">
              <div className="text-center">
                <Video className="w-16 h-16 text-[#39FF14] mx-auto mb-4" />
                <p className="text-[#A7ACB8]">Video call in progress</p>
                <p className="text-sm text-[#A7ACB8] mt-1">4 participants</p>
              </div>
              
              {/* Video controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Video className="w-5 h-5 text-[#F4F6FA]" />
                </button>
                <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Users className="w-5 h-5 text-[#F4F6FA]" />
                </button>
                <button className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors">
                  <span className="text-white font-medium">End</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="w-full md:w-[38%] border-t md:border-t-0 md:border-l border-white/10 flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-white/10">
              {['chat', 'participants', 'notes'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'text-[#39FF14] border-b-2 border-[#39FF14]' : 'text-[#A7ACB8] hover:text-[#F4F6FA]'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            {/* Tab Content */}
            <div className="flex-1 p-4 overflow-auto">
              {activeTab === 'chat' && (
                <div className="space-y-3">
                  <div className="chat-bubble">
                    <p className="text-sm">
                      <span className="text-[#39FF14] font-medium">Marcus:</span>{' '}
                      <span className="text-[#F4F6FA]">Let's walk through the prototype.</span>
                    </p>
                  </div>
                  <div className="chat-bubble">
                    <p className="text-sm">
                      <span className="text-[#39FF14] font-medium">You:</span>{' '}
                      <span className="text-[#F4F6FA]">Sharing screen now.</span>
                    </p>
                  </div>
                </div>
              )}
              
              {activeTab === 'participants' && (
                <div className="space-y-3">
                  {['Marcus Reid', 'Sarah Chen', 'You', 'Lina Park'].map((name, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#39FF14]/30 to-[#39FF14]/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-[#39FF14]">{name[0]}</span>
                      </div>
                      <span className="text-sm text-[#F4F6FA]">{name}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {activeTab === 'notes' && (
                <div>
                  <h4 className="text-sm font-semibold text-[#F4F6FA] mb-3">Action items</h4>
                  <div className="space-y-2">
                    {[
                      'Update copy on the onboarding modal',
                      'Add analytics event for "Invite sent"',
                      'Schedule usability test for Friday',
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded border border-[#39FF14] mt-0.5 flex items-center justify-center">
                          <Check className="w-3 h-3 text-[#39FF14]" />
                        </div>
                        <span className="text-sm text-[#F4F6FA]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Docs Section
function DocsSection() {
  const [activeDoc, setActiveDoc] = useState('Product Spec');
  const docs = ['Project Home', 'Product Spec', 'Meeting Notes', 'Sprint Plan', 'Team Wiki'];

  return (
    <section className="section-pinned bg-[#05060B]">
      <img src="/images/docs_bg.jpg" alt="" className="bg-image" />
      <div className="bg-overlay" />
      
      <div className="relative z-10 h-full flex items-center justify-center p-6">
        <div className="glass-panel w-full max-w-5xl h-[70vh] flex flex-col md:flex-row overflow-hidden">
          {/* Left Nav */}
          <div className="w-full md:w-[22%] border-b md:border-b-0 md:border-r border-white/10 p-4">
            <h3 className="font-semibold text-[#F4F6FA] mb-4">Documents</h3>
            <div className="space-y-1">
              {docs.map((doc, i) => (
                <button
                  key={i}
                  onClick={() => setActiveDoc(doc)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeDoc === doc ? 'bg-white/10 text-[#F4F6FA] border-l-2 border-[#39FF14]' : 'text-[#A7ACB8] hover:bg-white/5'}`}
                >
                  {doc}
                </button>
              ))}
            </div>
          </div>
          
          {/* Center Doc */}
          <div className="flex-1 p-6 overflow-auto">
            <h2 className="text-2xl font-semibold text-[#F4F6FA] mb-2">Tools that keep you in flow</h2>
            <p className="text-sm text-[#A7ACB8] mb-6">
              Docs, tasks, and decisions—right next to your conversations. No more lost context.
            </p>
            
            <div className="prose prose-invert max-w-none">
              <h3 className="text-xl font-medium text-[#F4F6FA] mb-4">{activeDoc} — Q2 Onboarding</h3>
              <div className="space-y-4 text-[#A7ACB8]">
                <p>Our onboarding flow needs to be streamlined to reduce time-to-value for new users. Key areas of focus:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Simplify the signup process to 3 steps maximum</li>
                  <li>Add interactive tutorials for core features</li>
                  <li>Implement progressive profiling to collect data over time</li>
                  <li>Create personalized onboarding based on user role</li>
                </ul>
                <p>Success metrics: 80% completion rate, &lt;5 min time-to-first-message.</p>
              </div>
            </div>
          </div>
          
          {/* Right Panel */}
          <div className="w-full md:w-[28%] border-t md:border-t-0 md:border-l border-white/10 p-4">
            <h3 className="font-semibold text-[#F4F6FA] mb-4">Tasks</h3>
            <div className="space-y-2 mb-6">
              {[
                { text: 'Review copy', done: true },
                { text: 'Update designs', done: true },
                { text: 'Implement changes', done: false },
                { text: 'Test with users', done: false },
              ].map((task, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${task.done ? 'bg-[#39FF14] border-[#39FF14]' : 'border-[#A7ACB8]'}`}>
                    {task.done && <Check className="w-3 h-3 text-[#05060B]" />}
                  </div>
                  <span className={`text-sm ${task.done ? 'text-[#A7ACB8] line-through' : 'text-[#F4F6FA]'}`}>{task.text}</span>
                </div>
              ))}
            </div>
            
            <h3 className="font-semibold text-[#F4F6FA] mb-4">This Week</h3>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <div key={i} className="text-[#A7ACB8]">{day}</div>
              ))}
              {Array.from({ length: 28 }, (_, i) => (
                <div 
                  key={i} 
                  className={`aspect-square flex items-center justify-center rounded ${i === 14 ? 'bg-[#39FF14] text-[#05060B] font-medium' : 'text-[#F4F6FA] hover:bg-white/5'}`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Security Section
function SecuritySection() {
  return (
    <section className="section-pinned bg-[#05060B]">
      <img src="/images/security_bg.jpg" alt="" className="bg-image" />
      <div className="bg-overlay" />
      
      <div className="relative z-10 h-full flex items-center justify-center p-6">
        <div className="glass-panel w-full max-w-4xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#F4F6FA] mb-4">
                Built to stay on
              </h2>
              <p className="text-[#A7ACB8] leading-relaxed">
                Enterprise-grade uptime, encryption, and compliance—without the enterprise friction.
              </p>
              
              <div className="mt-8 flex items-center gap-3">
                <div className="status-dot" />
                <span className="text-[#39FF14] font-medium">All systems operational</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {[
                { icon: Shield, text: 'SOC 2 Type II' },
                { icon: Lock, text: 'GDPR-ready data handling' },
                { icon: Database, text: 'End-to-end encryption for DMs' },
                { icon: Globe, text: '99.99% SLA' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                  <div className="w-10 h-10 rounded-lg bg-[#39FF14]/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-[#39FF14]" />
                  </div>
                  <span className="text-[#F4F6FA] font-medium">{item.text}</span>
                  <Check className="w-5 h-5 text-[#39FF14] ml-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Integrations Section
function IntegrationsSection() {
  const integrations = [
    { name: 'GitHub', icon: Github },
    { name: 'Figma', icon: Layers },
    { name: 'Slack', icon: MessageCircle },
    { name: 'Jira', icon: FileText },
    { name: 'Notion', icon: FileText },
    { name: 'Linear', icon: Zap },
  ];

  return (
    <section className="section-pinned bg-[#05060B]">
      <img src="/images/integrations_bg.jpg" alt="" className="bg-image" />
      <div className="bg-overlay" />
      
      <div className="relative z-10 h-full flex items-center justify-center p-6">
        <div className="glass-panel w-full max-w-4xl p-8 md:p-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-[#F4F6FA] mb-4">
              Plays well with your stack
            </h2>
            <p className="text-[#A7ACB8] max-w-xl mx-auto">
              Connect the tools you already use. Automate handoffs and keep everyone in sync.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {integrations.map((integration, i) => (
              <div key={i} className="integration-tile p-6 flex flex-col items-center gap-3 cursor-pointer">
                <integration.icon className="w-8 h-8 text-[#39FF14]" />
                <span className="text-[#F4F6FA] font-medium">{integration.name}</span>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <button className="btn-secondary px-6 py-3 text-sm font-medium inline-flex items-center gap-2">
              Browse integrations
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Analytics Section
function AnalyticsSection() {
  return (
    <section className="section-pinned bg-[#05060B]">
      <img src="/images/analytics_bg.jpg" alt="" className="bg-image" />
      <div className="bg-overlay" />
      
      <div className="relative z-10 h-full flex items-center justify-center p-6">
        <div className="glass-panel w-full max-w-4xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#F4F6FA] mb-4">
                Insights that move the needle
              </h2>
              <p className="text-[#A7ACB8] leading-relaxed mb-8">
                See where time goes, spot blockers early, and improve team velocity—without the spreadsheet work.
              </p>
              
              <div className="space-y-4">
                {[
                  { label: 'Response time down', value: '34%' },
                  { label: 'Meetings reduced', value: '12%' },
                  { label: 'Tasks completed faster', value: '1.4x' },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                    <span className="text-[#A7ACB8]">{stat.label}</span>
                    <span className="text-2xl font-bold text-[#39FF14]">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Chart placeholder */}
              <div className="h-48 bg-white/5 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute inset-0 flex items-end justify-between px-4 pb-4">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                    <div 
                      key={i} 
                      className="w-4 bg-[#39FF14]/30 rounded-t"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <BarChart3 className="w-12 h-12 text-[#39FF14]/50" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-[#A7ACB8] text-sm mb-1">Top channel</p>
                  <p className="text-[#F4F6FA] font-medium">#design-system</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-[#A7ACB8] text-sm mb-1">Most active time</p>
                  <p className="text-[#F4F6FA] font-medium">10am–12pm</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Use Cases Section
function UseCasesSection() {
  const useCases = [
    { title: 'Product teams', desc: 'Specs, decisions, and roadmaps in one place.', icon: Layers },
    { title: 'Engineering', desc: 'CI alerts, code discussion, and incident channels.', icon: Cpu },
    { title: 'Design', desc: 'Critiques, handoffs, and asset reviews—async or live.', icon: Zap },
    { title: 'Marketing', desc: 'Campaign planning, content calendars, and approvals.', icon: BarChart3 },
    { title: 'Support', desc: 'Ticket triage, escalations, and team huddles.', icon: MessageCircle },
    { title: 'Leadership', desc: 'Weekly updates, OKRs, and cross-functional sync.', icon: Users },
  ];

  return (
    <section id="features" className="min-h-screen bg-[#0B0E14] grain-overlay py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#F4F6FA] mb-4">
            Built for every team
          </h2>
          <p className="text-[#A7ACB8] max-w-xl">
            From startups to enterprises, Nexus adapts to how your team actually works.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {useCases.map((useCase, i) => (
            <div key={i} className="glass-panel p-6 hover:border-[#39FF14]/30 transition-colors">
              <useCase.icon className="w-8 h-8 text-[#39FF14] mb-4" />
              <h3 className="text-lg font-semibold text-[#F4F6FA] mb-2">{useCase.title}</h3>
              <p className="text-[#A7ACB8] text-sm">{useCase.desc}</p>
            </div>
          ))}
        </div>
        
        {/* Testimonials */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-panel p-8">
            <p className="text-[#F4F6FA] text-lg mb-4">
              "We cut meeting time by 30% in the first month."
            </p>
            <p className="text-[#A7ACB8] text-sm">
              — Engineering Lead, Fintech
            </p>
          </div>
          <div className="glass-panel p-8">
            <p className="text-[#F4F6FA] text-lg mb-4">
              "The thread model finally kept our specs readable."
            </p>
            <p className="text-[#A7ACB8] text-sm">
              — Product Manager, SaaS
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// CTA + Footer Section
function CTASection() {
  const [email, setEmail] = useState('');

  return (
    <section className="min-h-screen bg-[#05060B] relative">
      <img src="/images/cta_bg.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#05060B]/60 to-[#05060B]/90" />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="glass-panel w-full max-w-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-[#F4F6FA] mb-4">
              Ready when you are
            </h2>
            <p className="text-[#A7ACB8] mb-8 max-w-lg mx-auto">
              Start free. Upgrade when you need more power, more history, and more control.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button className="btn-primary px-8 py-4 text-base font-semibold flex items-center justify-center gap-2">
                Create your workspace
                <ArrowRight className="w-4 h-4" />
              </button>
              <button className="btn-secondary px-8 py-4 text-base font-medium">
                Talk to sales
              </button>
            </div>
            
            {/* Newsletter */}
            <div className="border-t border-white/10 pt-8">
              <p className="text-[#A7ACB8] text-sm mb-4">Get product updates</p>
              <div className="flex gap-2 max-w-md mx-auto">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input flex-1 px-4 py-3 text-[#F4F6FA]"
                  placeholder="Email address"
                />
                <button className="btn-primary px-6 py-3 text-sm font-medium">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="border-t border-white/10 py-8 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#39FF14] flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-[#05060B]" />
              </div>
              <span className="text-xl font-semibold text-[#F4F6FA]">Nexus</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <a href="#" className="text-[#A7ACB8] hover:text-[#F4F6FA] transition-colors">Product</a>
              <a href="#" className="text-[#A7ACB8] hover:text-[#F4F6FA] transition-colors">Solutions</a>
              <a href="#" className="text-[#A7ACB8] hover:text-[#F4F6FA] transition-colors">Security</a>
              <a href="#" className="text-[#A7ACB8] hover:text-[#F4F6FA] transition-colors">Pricing</a>
              <a href="#" className="text-[#A7ACB8] hover:text-[#F4F6FA] transition-colors">Docs</a>
              <a href="#" className="text-[#A7ACB8] hover:text-[#F4F6FA] transition-colors">Status</a>
              <a href="#" className="text-[#A7ACB8] hover:text-[#F4F6FA] transition-colors">Privacy</a>
              <a href="#" className="text-[#A7ACB8] hover:text-[#F4F6FA] transition-colors">Terms</a>
            </div>
            
            <div className="flex items-center gap-4">
              <Github className="w-5 h-5 text-[#A7ACB8] hover:text-[#F4F6FA] cursor-pointer transition-colors" />
              <Twitter className="w-5 h-5 text-[#A7ACB8] hover:text-[#F4F6FA] cursor-pointer transition-colors" />
              <MessageCircle className="w-5 h-5 text-[#A7ACB8] hover:text-[#F4F6FA] cursor-pointer transition-colors" />
            </div>
          </div>
          
          <div className="max-w-6xl mx-auto mt-6 text-center">
            <p className="text-[#A7ACB8] text-xs">
              © 2026 Nexus Platform. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </section>
  );
}

// Main App Component
function App() {
  return (
    <div className="bg-[#05060B] min-h-screen">
      <Navigation />
      
      <main>
        <HeroSection />
        <ThreadsSection />
        <VideoSection />
        <DocsSection />
        <SecuritySection />
        <IntegrationsSection />
        <AnalyticsSection />
        <UseCasesSection />
        <CTASection />
      </main>
    </div>
  );
}

export default App;
