'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import mermaid from 'mermaid';
import { getReports, saveReport, deleteReport } from '@/lib/firebase/firebaseUtils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface AnimationSection {
  heading: string;
  lineIndex: number;
  content: string;
}

interface Report {
  id?: string;
  userId: string;
  title: string;
  content: string;
  animations: AnimationSection[];
  createdAt: Date;
  updatedAt: Date;
}

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis'
  },
  sequence: {
    useMaxWidth: true,
    showSequenceNumbers: true,
    actorMargin: 50,
    boxMargin: 10,
    boxTextMargin: 5,
    noteMargin: 10,
    messageMargin: 35,
    mirrorActors: false
  },
  mindmap: {
    useMaxWidth: true,
    padding: 16
  },
  gantt: {
    titleTopMargin: 25,
    barHeight: 20,
    barGap: 4,
    topPadding: 50
  }
});

const MermaidDiagram = ({ content, heading }: { content: string; heading: string }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [diagramCode, setDiagramCode] = useState<string>('');
  const [diagramId] = useState(`mermaid-${Math.random().toString(36).substring(2, 9)}`);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!content) return;
    
    setIsLoading(true);
    setError(null);
    
    const renderDiagram = async () => {
      try {
        // Generate appropriate diagram based on content
        const code = generateMermaidCode(content, heading);
        setDiagramCode(code);
        
        // First check if the diagram is valid
        const { svg } = await mermaid.render(diagramId, code);
        
        if (elementRef.current) {
          elementRef.current.innerHTML = svg;
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error rendering diagram:', err);
        setError('Failed to render diagram');
        setIsLoading(false);
      }
    };
    
    renderDiagram();
  }, [content, heading, diagramId]);
  
  return (
    <div className="mermaid-diagram p-4 bg-white rounded-lg shadow">
      {isLoading && (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
      {error && (
        <div className="text-red-500 text-center p-4">
          {error}
        </div>
      )}
      <div ref={elementRef} className={`mermaid-container flex justify-center ${isLoading ? 'hidden' : ''}`}></div>
    </div>
  );
};

const generateMermaidCode = (content: string, heading: string): string => {
  // Sanitize inputs to prevent Mermaid syntax errors
  const sanitizeText = (text: string) => {
    return text
      .replace(/"/g, "'")
      .replace(/[[\]]/g, '')
      .replace(/[()]/g, '')
      .trim();
  };

  // Helper to check if content contains certain keywords
  const containsKeywords = (text: string, keywords: string[]): boolean => {
    return keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
  };

  // Check for trade agreements or partnerships
  if (containsKeywords(content, ['agreement', 'partnership', 'trade', 'collaboration'])) {
    let flowchartCode = 'graph LR\n';
    flowchartCode += `    A(("${sanitizeText(heading)}"))\n`;
    
    // Extract key entities
    const entities = content
      .split(/[,.;]/)
      .filter(s => s.trim().length > 0)
      .slice(0, 4)
      .map(s => sanitizeText(s.trim()));

    entities.forEach((entity, index) => {
      flowchartCode += `    A --> B${index}["${entity}"]\n`;
      flowchartCode += `    style B${index} fill:#e1f5fe,stroke:#01579b\n`;
    });
    
    flowchartCode += `    style A fill:#0277bd,stroke:#01579b,color:#fff\n`;
    return flowchartCode;
  }

  // Check for market analysis or opportunities
  if (containsKeywords(content, ['market', 'growth', 'opportunity', 'expansion'])) {
    let flowchartCode = 'graph TD\n';
    flowchartCode += `    M(("${sanitizeText(heading)}"))\n`;
    
    const opportunities = content
      .split(/[.!?]/)
      .filter(s => s.trim().length > 0 && containsKeywords(s, ['growth', 'opportunity', 'potential', 'market']))
      .slice(0, 4)
      .map(s => sanitizeText(s.trim()));

    opportunities.forEach((opp, index) => {
      flowchartCode += `    M --> O${index}["${opp}"]\n`;
      flowchartCode += `    style O${index} fill:#f3e5f5,stroke:#4a148c\n`;
    });
    
    flowchartCode += `    style M fill:#7b1fa2,stroke:#4a148c,color:#fff\n`;
    return flowchartCode;
  }

  // Check for competitive analysis or comparison
  if (containsKeywords(content, ['competitive', 'versus', 'vs', 'compared', 'competition'])) {
    let comparisonCode = 'graph TB\n';
    comparisonCode += `    subgraph Comparison\n`;
    
    const aspects = content
      .split(/[.!?]/)
      .filter(s => s.trim().length > 0)
      .slice(0, 3)
      .map(s => sanitizeText(s.trim()));

    aspects.forEach((aspect, index) => {
      comparisonCode += `    A${index}["${aspect}"]\n`;
    });
    
    for (let i = 0; i < aspects.length - 1; i++) {
      comparisonCode += `    A${i} --> A${i + 1}\n`;
    }
    
    comparisonCode += `    end\n`;
    comparisonCode += `    style Comparison fill:#f5f5f5,stroke:#333,stroke-width:2px\n`;
    aspects.forEach((_, index) => {
      comparisonCode += `    style A${index} fill:#e8eaf6,stroke:#1a237e\n`;
    });
    
    return comparisonCode;
  }

  // Check for sequential processes or steps
  if (containsKeywords(content, ['step', 'process', 'timeline', 'sequence', 'first', 'then', 'finally'])) {
    let sequenceCode = 'graph TD\n';
    
    const steps = content
      .split(/[.!?]/)
      .filter(s => s.trim().length > 0)
      .slice(0, 5)
      .map(s => sanitizeText(s.trim()));

    steps.forEach((step, index) => {
      sequenceCode += `    S${index}["${step}"]\n`;
      if (index > 0) {
        sequenceCode += `    S${index-1} --> S${index}\n`;
      }
    });
    
    steps.forEach((_, index) => {
      sequenceCode += `    style S${index} fill:#fff3e0,stroke:#e65100\n`;
    });
    
    return sequenceCode;
  }

  // Default to a mind map for strategic overviews and general content
  const keyPoints = content
    .split(/[.!?]/)
    .filter(s => s.trim().length > 0)
    .slice(0, 5);

  if (keyPoints.length > 0) {
    let mindmapCode = 'mindmap\n';
    mindmapCode += `  root((${sanitizeText(heading)}))\n`;
    
    keyPoints.forEach((point, index) => {
      const nodeText = sanitizeText(point.substring(0, 50) + (point.length > 50 ? '...' : ''));
      mindmapCode += `    ${nodeText}\n`;
    });
    
    return mindmapCode;
  }

  // Fallback to a simple node if no content can be processed
  return 'graph TD\n    A["No content to visualize"]';
};

export default function Home() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const [markdownContent, setMarkdownContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [animations, setAnimations] = useState<AnimationSection[]>([]);
  const [showVisualization, setShowVisualization] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportTitle, setReportTitle] = useState('');
  const [showReports, setShowReports] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isDownloading, setIsDownloading] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      console.log('No user found, redirecting to auth...');
      router.push('/auth');
    } else if (user) {
      loadReports();
    }
  }, [user, loading, router]);

  const loadReports = async () => {
    if (!user) return;
    
    setIsLoadingReports(true);
    setLoadError(null);
    
    try {
      console.log('Loading reports for user:', user.uid);
      const userReports = await getReports(user.uid);
      console.log('Loaded reports:', userReports);
      setReports(userReports);
      
      if (userReports.length === 0) {
        setLoadError('No reports found. Create a new report to get started.');
      }
    } catch (error: any) {
      console.error('Error loading reports:', error);
      const errorMessage = error.message || 'Failed to load reports. Please try again.';
      setLoadError(errorMessage);
      showToastMessage(errorMessage, 'error');
    } finally {
      setIsLoadingReports(false);
    }
  };

  // Add this useEffect to load reports when showReports changes to true
  useEffect(() => {
    if (showReports && user) {
      loadReports();
    }
  }, [showReports, user]);

  const generateTitleFromContent = (content: string): string => {
    // Extract the first heading if available
    const headingMatch = content.match(/^#\s+(.+)$/m);
    if (headingMatch) {
      return headingMatch[1].trim();
    }
    
    // If no heading, use the first line of content
    const firstLine = content.split('\n')[0].trim();
    if (firstLine && firstLine.length > 0) {
      // Limit to 50 characters
      return firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine;
    }
    
    // If content is empty, use a default title
    return 'Untitled Report';
  };

  const showToastMessage = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    // Hide toast after 3 seconds
    setTimeout(() => {
      setShowToast(false);
      // Clear message after fade out animation
      setTimeout(() => setToastMessage(''), 300);
    }, 3000);
  };

  const handleSaveReport = async () => {
    if (!user || !reportTitle.trim()) return;
    
    setIsSaving(true);
    try {
      const report: Omit<Report, 'id'> = {
        userId: user.uid,
        title: reportTitle,
        content: markdownContent,
        animations: animations,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await saveReport(report);
      await loadReports();
      showToastMessage('Report saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving report:', error);
      showToastMessage('Failed to save report', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadReport = (report: Report) => {
    setMarkdownContent(report.content);
    setAnimations(report.animations);
    setShowVisualization(true);
    setSelectedReport(report);
    setReportTitle(report.title);
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteReport(reportId);
      await loadReports();
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
        setMarkdownContent('');
        setAnimations([]);
        setShowVisualization(false);
        setReportTitle('');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMarkdownContent(value);
    setShowVisualization(false);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    setMarkdownContent(pastedText);
    setShowVisualization(false);
  };

  const findHeadingsAndContent = (markdown: string): AnimationSection[] => {
    const lines = markdown.split('\n');
    const sections: AnimationSection[] = [];
    let currentHeadingIndex = -1;
    
    lines.forEach((line, index) => {
      if (line.startsWith('#')) {
        if (currentHeadingIndex !== -1) {
          // Get content between this heading and the previous one
          const content = lines.slice(currentHeadingIndex + 1, index).join('\n').trim();
          // Only add content if there is actual text between headings
          if (content) {
            sections[sections.length - 1].content = content;
          } else {
            // Remove the section if there was no content
            sections.pop();
          }
        }
        sections.push({
          heading: line.replace(/^#+\s+/, ''),
          lineIndex: index,
          content: '' // Will be filled in next iteration or at the end
        });
        currentHeadingIndex = index;
      }
    });

    // Handle content after the last heading
    if (currentHeadingIndex !== -1 && currentHeadingIndex < lines.length - 1) {
      const content = lines.slice(currentHeadingIndex + 1).join('\n').trim();
      // Only keep the last section if it has content
      if (content) {
        sections[sections.length - 1].content = content;
      } else {
        sections.pop();
      }
    }

    return sections;
  };

  const handleSubmit = async () => {
    if (!markdownContent.trim()) {
      return;
    }

    setIsProcessing(true);
    try {
      const foundSections = findHeadingsAndContent(markdownContent);
      setAnimations(foundSections);
      setShowVisualization(true);
      
      // Generate title from content
      const generatedTitle = generateTitleFromContent(markdownContent);
      setReportTitle(generatedTitle);
    } catch (error) {
      console.error('Error processing markdown:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderDocument = () => {
    if (!showVisualization) return null;

    const lines = markdownContent.split('\n');
    const content: JSX.Element[] = [];
    let currentLine = 0;

    animations.forEach((section, index) => {
      // Add any text before the section
      if (currentLine < section.lineIndex) {
        content.push(
          <pre key={`text-${index}`} className="whitespace-pre-wrap font-['Arial'] text-xs">
            {lines.slice(currentLine, section.lineIndex).join('\n')}
          </pre>
        );
      }

      // Add the section with its diagram
      content.push(
        <div key={`section-${index}`} className="my-4">
          <pre className={`whitespace-pre-wrap font-['Arial'] font-bold ${
            lines[section.lineIndex].startsWith('# ') ? 'text-2xl' : 'text-xl'
          }`}>
            {lines[section.lineIndex]}
          </pre>
          <div className="mt-4 space-y-4 bg-gray-50 p-4 rounded-lg">
            <MermaidDiagram content={section.content} heading={section.heading} />
          </div>
        </div>
      );

      currentLine = section.lineIndex + 1;
    });

    // Add any remaining text after the last section
    if (currentLine < lines.length) {
      content.push(
        <pre key="text-final" className="whitespace-pre-wrap font-['Arial'] text-xs">
          {lines.slice(currentLine).join('\n')}
        </pre>
      );
    }

    return (
      <div className="space-y-6 font-['Arial']">
        {content}
      </div>
    );
  };

  const handleStartNew = () => {
    setMarkdownContent('');
    setShowVisualization(false);
    setAnimations([]);
    setReportTitle('');
    setSelectedReport(null);
  };

  const handleDownloadPDF = async () => {
    if (!documentRef.current) return;
    
    setIsDownloading(true);
    try {
      // Wait for all diagrams to be rendered first
      const diagramElements = documentRef.current.querySelectorAll('.mermaid-container svg');
      const diagrams = Array.from(diagramElements).map((svg, index) => ({
        svg: svg.cloneNode(true) as SVGElement, // Clone to prevent modifications to displayed diagram
        index
      }));

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      // A4 dimensions in points
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 72; // 1 inch margins
      const contentWidth = pageWidth - (2 * margin);
      let yPosition = margin;

      // Set up fonts
      pdf.setFont('helvetica');

      const lines = markdownContent.split('\n');
      let diagramIndex = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
          yPosition += 12;
          continue;
        }

        // Add new page if needed
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        // Handle different line types
        if (line.startsWith('# ')) {
          const text = line.replace(/^# /, '');
          pdf.setFontSize(24);
          pdf.setFont('helvetica', 'bold');
          const wrappedText = pdf.splitTextToSize(text, contentWidth);
          wrappedText.forEach((textLine: string) => {
            if (yPosition > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin;
            }
            pdf.text(textLine, margin, yPosition);
            yPosition += 36;
          });
          yPosition += 10;
        } else if (line.startsWith('## ')) {
          const text = line.replace(/^## /, '');
          pdf.setFontSize(20);
          pdf.setFont('helvetica', 'bold');
          const wrappedText = pdf.splitTextToSize(text, contentWidth);
          wrappedText.forEach((textLine: string) => {
            if (yPosition > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin;
            }
            pdf.text(textLine, margin, yPosition);
            yPosition += 30;
          });
          yPosition += 8;
        } else {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          const wrappedText = pdf.splitTextToSize(line, contentWidth);
          wrappedText.forEach((textLine: string) => {
            if (yPosition > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin;
            }
            pdf.text(textLine, margin, yPosition);
            yPosition += 18;
          });
          yPosition += 6;
        }

        // Check if this line has an associated diagram
        const section = animations.find(s => s.lineIndex === i);
        if (section && diagramIndex < diagrams.length) {
          try {
            const diagram = diagrams[diagramIndex];
            const svgElement = diagram.svg;

            // Ensure SVG has explicit dimensions
            if (!svgElement.hasAttribute('width') || !svgElement.hasAttribute('height')) {
              const viewBox = svgElement.getAttribute('viewBox')?.split(' ').map(Number) || [0, 0, 800, 600];
              svgElement.setAttribute('width', String(viewBox[2]));
              svgElement.setAttribute('height', String(viewBox[3]));
            }
            
            // Convert SVG to canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Get SVG dimensions
            const svgWidth = parseFloat(svgElement.getAttribute('width') || '800');
            const svgHeight = parseFloat(svgElement.getAttribute('height') || '600');
            
            // Set canvas size to match SVG
            canvas.width = svgWidth * 2; // Higher resolution
            canvas.height = svgHeight * 2; // Higher resolution
            
            // Scale context for higher resolution
            ctx?.scale(2, 2);
            
            // Create a blob from the SVG
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);
            
            // Load image and add to PDF
            await new Promise((resolve, reject) => {
              const img = new Image();
              img.onload = () => {
                if (ctx) {
                  // Clear canvas and draw image
                  ctx.fillStyle = '#ffffff';
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
                  
                  // Calculate scaled dimensions to fit page width
                  const scale = Math.min(1, contentWidth / svgWidth);
                  const scaledWidth = svgWidth * scale;
                  const scaledHeight = svgHeight * scale;
                  
                  // Add new page if diagram won't fit
                  if (yPosition + scaledHeight > pageHeight - margin) {
                    pdf.addPage();
                    yPosition = margin;
                  }
                  
                  // Add the diagram with white background
                  const imgData = canvas.toDataURL('image/png');
                  pdf.addImage(imgData, 'PNG', margin, yPosition, scaledWidth, scaledHeight);
                  yPosition += scaledHeight + 24;
                }
                
                URL.revokeObjectURL(svgUrl);
                resolve(null);
              };
              img.onerror = reject;
              img.src = svgUrl;
            });
            
            diagramIndex++;
          } catch (error) {
            console.error('Error adding diagram to PDF:', error);
          }
        }
      }

      pdf.save(`${reportTitle || 'report'}.pdf`);
      showToastMessage('PDF downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToastMessage('Failed to generate PDF', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  // Show loading state while checking auth
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-gray-100">
      {/* Toast Notification */}
      <div 
        className={`fixed top-4 right-4 z-50 transition-all duration-300 ease-in-out transform ${
          showToast ? 'translate-y-0 opacity-100' : 'translate-y-[-1rem] opacity-0 pointer-events-none'
        }`}
      >
        <div className={`px-6 py-3 rounded-lg shadow-lg ${
          toastType === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white flex items-center space-x-2`}>
          {toastType === 'success' ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span>{toastMessage}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-6xl font-bold">Deep Research Visualizer</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowReports(!showReports)}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              {showReports ? 'Hide Reports' : 'Show Reports'}
            </button>
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>

        {showReports && (
          <div className="mb-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Your Reports</h2>
            <div className="space-y-4">
              {isLoadingReports ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : loadError ? (
                <div className="text-red-500 text-center py-4">
                  {loadError}
                  <button
                    onClick={loadReports}
                    className="ml-2 text-blue-500 hover:text-blue-700 underline"
                  >
                    Try Again
                  </button>
                </div>
              ) : reports.length === 0 ? (
                <p className="text-gray-500 text-center">No reports yet</p>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium">{report.title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLoadReport(report)}
                        className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => report.id && handleDeleteReport(report.id)}
                        className="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Upload Your Markdown Document</h2>
          <p className="text-gray-600 mb-4">
            Paste your markdown content below to visualize it with Mermaid diagrams.
          </p>
          <div className="space-y-4">
            <div className="relative">
              {showVisualization && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Report Title:</span> {reportTitle}
                  </p>
                </div>
              )}
              <textarea
                id="markdown-input"
                name="markdown-input"
                value={markdownContent}
                onChange={handleContentChange}
                onPaste={handlePaste}
                placeholder="Paste your markdown content here..."
                className="block w-full h-64 p-4 text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm leading-6"
                style={{ minHeight: '16rem' }}
                spellCheck="false"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                readOnly={showVisualization}
              />
            </div>
            <div className="flex justify-end gap-4">
              {showVisualization ? (
                <>
                  <button
                    onClick={handleSaveReport}
                    disabled={isSaving}
                    className={`flex items-center px-6 py-2 text-white rounded-lg ${
                      isSaving ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save Report'
                    )}
                  </button>
                  <button
                    onClick={handleStartNew}
                    className="flex items-center px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Start New
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!markdownContent.trim() || isProcessing}
                  className={`flex items-center px-6 py-2 text-white rounded-lg ${
                    !markdownContent.trim() || isProcessing
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Visualize'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {showVisualization && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-end mb-4">
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className={`flex items-center px-4 py-2 text-white rounded-lg ${
                  isDownloading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isDownloading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>
            </div>
            <div className="prose max-w-none" ref={documentRef}>
              {renderDocument()}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
