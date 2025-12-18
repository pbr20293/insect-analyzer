import { Activity } from 'lucide-react';

interface AnalyticsDashboardProps {
    markdownContent: string | null;
}

interface DetectionData {
    totalObjects: number;
    objectTypes: { [key: string]: number };
    confidence: number;
    processingTime?: string;
    warnings?: string[];
    detections?: Array<{class: string, confidence: number}>;
}

const parseAnalysisText = (text: string): DetectionData => {
    const data: DetectionData = {
        totalObjects: 0,
        objectTypes: {},
        confidence: 0,
        detections: []
    };

    console.log('Parsing analysis text:', text);

    // Remove markdown bold formatting for easier parsing
    const cleanText = text.replace(/\*\*/g, '');

    // Split text into lines for easier processing
    const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line);

    let parsingClasses = false;
    let parsingDetections = false;

    for (const line of lines) {
        // Extract total detections
        const totalMatch = line.match(/^Total Detections:\s*(\d+)/i);
        if (totalMatch) {
            data.totalObjects = parseInt(totalMatch[1]);
            continue;
        }

        // Check for "No objects detected"
        if (line.toLowerCase().includes('no objects detected')) {
            data.totalObjects = 0;
            continue;
        }

        // Check for section headers
        if (line.toLowerCase().includes('classes detected')) {
            parsingClasses = true;
            parsingDetections = false;
            continue;
        }

        if (line.toLowerCase().includes('detections:')) {
            parsingDetections = true;
            parsingClasses = false;
            continue;
        }

        // Parse classes section (format: "- crack: 1")
        if (parsingClasses && line.startsWith('-')) {
            const classMatch = line.match(/^\-\s*([^:]+):\s*(\d+)/);
            if (classMatch) {
                const className = classMatch[1].trim().toLowerCase();
                const count = parseInt(classMatch[2]);
                if (count > 0) {
                    data.objectTypes[className] = count;
                }
            }
        }

        // Parse detections section (format: "1. crack (conf: 0.423)")
        if (parsingDetections) {
            const detectionMatch = line.match(/^\d+\.\s*([^(]+)\s*\(conf:\s*([0-9.]+)\)/i);
            if (detectionMatch) {
                const className = detectionMatch[1].trim().toLowerCase();
                const confidence = parseFloat(detectionMatch[2]);
                data.detections!.push({ class: className, confidence });

                // Update overall confidence as average
                const totalConf = data.detections!.reduce((sum, d) => sum + d.confidence, 0);
                data.confidence = totalConf / data.detections!.length;
            }
        }
    }

    // If we didn't find total detections but have detections array, use its length
    if (data.totalObjects === 0 && data.detections!.length > 0) {
        data.totalObjects = data.detections!.length;
    }

    // If we didn't find classes but have detections, count unique classes
    if (Object.keys(data.objectTypes).length === 0 && data.detections!.length > 0) {
        const classCounts: { [key: string]: number } = {};
        data.detections!.forEach(d => {
            classCounts[d.class] = (classCounts[d.class] || 0) + 1;
        });
        data.objectTypes = classCounts;
    }

    return data;
};

export const AnalyticsDashboard = ({ markdownContent }: AnalyticsDashboardProps) => {
    const analysisData = parseAnalysisText(markdownContent || '');

    return (
        <div className="glass-panel" style={{
            marginTop: '0rem',
            borderRadius: 0,
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: 'none',
            height: '250px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            <div style={{
                padding: '0.8rem 1.5rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem'
            }}>
                <Activity size={18} color="var(--success)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Analytics Dashboard</h3>
            </div>

            <div style={{
                flex: 1,
                padding: '1rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                {markdownContent ? (
                    <>
                        {/* All Stats in One Row */}
                        <div style={{
                            display: 'flex',
                            gap: '0.8rem',
                            height: '100px'
                        }}>
                            {/* Total Detections */}
                            <div style={{
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                borderRadius: '8px',
                                padding: '0.8rem',
                                textAlign: 'center',
                                minWidth: '80px',
                                flex: '0 0 80px'
                            }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                                    Total
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                                    {analysisData.totalObjects || '0'}
                                </div>
                            </div>

                            {/* Classes Detected */}
                            <div style={{
                                background: 'rgba(34, 197, 94, 0.1)',
                                border: '1px solid rgba(34, 197, 94, 0.2)',
                                borderRadius: '8px',
                                padding: '0.8rem',
                                textAlign: 'center',
                                minWidth: '80px',
                                flex: '0 0 80px'
                            }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                                    Classes
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#22c55e' }}>
                                    {Object.keys(analysisData.objectTypes).length || '0'}
                                </div>
                            </div>

                            {/* Detections */}
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '8px',
                                padding: '0.8rem',
                                textAlign: 'center',
                                minWidth: '110px',
                                flex: '0 0 110px',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                                    Detections
                                </div>
                                <div style={{
                                    fontSize: '0.6rem',
                                    fontWeight: 'bold',
                                    color: '#ef4444',
                                    flex: 1,
                                    overflowY: 'auto',
                                    lineHeight: '1.2',
                                    wordBreak: 'break-word',
                                    textAlign: 'left'
                                }}>
                                    {analysisData.detections && analysisData.detections.length > 0 ? (
                                        analysisData.detections.map((detection, index) => (
                                            <div key={index} style={{ 
                                                marginBottom: '2px',
                                                fontSize: '0.6rem',
                                                padding: '1px 2px'
                                            }}>
                                                <div style={{ fontWeight: 600 }}>{detection.class}</div>
                                                <div style={{ fontSize: '0.55rem', opacity: 0.8 }}>({detection.confidence.toFixed(2)})</div>
                                            </div>
                                        ))
                                    ) : (
                                        'None'
                                    )}
                                </div>
                            </div>

                            {/* Detection Breakdown - Takes remaining space */}
                            {Object.keys(analysisData.objectTypes).length > 0 && (
                                <div style={{
                                    background: 'rgba(0,0,0,0.05)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    padding: '0.8rem',
                                    flex: '1',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                                        Breakdown
                                    </div>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                                        gap: '0.4rem',
                                        flex: 1,
                                        overflowY: 'auto'
                                    }}>
                                        {Object.entries(analysisData.objectTypes).map(([type, count]) => (
                                            <div key={type} style={{
                                                background: 'var(--bg-secondary)',
                                                padding: '0.4rem 0.3rem',
                                                borderRadius: '4px',
                                                textAlign: 'center',
                                                fontSize: '0.7rem',
                                                minHeight: '40px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center'
                                            }}>
                                                <div style={{ 
                                                    fontWeight: 600, 
                                                    textTransform: 'capitalize', 
                                                    lineHeight: '1.1',
                                                    wordBreak: 'break-word',
                                                    fontSize: '0.65rem'
                                                }}>
                                                    {type}
                                                </div>
                                                <div style={{ color: 'var(--accent-color)', fontSize: '0.8rem', fontWeight: 'bold' }}>{count}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Raw Analysis Text */}
                        <div style={{
                            background: 'rgba(0,0,0,0.05)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '0.8rem',
                            fontSize: '0.75rem',
                            lineHeight: '1.3',
                            whiteSpace: 'pre-wrap',
                            flex: 1,
                            minHeight: '60px',
                            maxHeight: '80px',
                            overflowY: 'auto'
                        }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                                Raw Analysis
                            </div>
                            {markdownContent}
                        </div>
                    </>
                ) : (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)',
                        fontStyle: 'italic'
                    }}>
                        Select an image to view detailed analytics.
                    </div>
                )}
            </div>
        </div>
    );
};
