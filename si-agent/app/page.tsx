import Sidebar from './components/Sidebar';
import ClaudeChat from './components/ClaudeChat';

export default function Home() {
  return (
    <div className="h-screen flex bg-white dark:bg-gray-950">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ClaudeChat />
      </div>
    </div>
  );
}
