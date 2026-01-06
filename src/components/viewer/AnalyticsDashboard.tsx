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
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--bg-panel)',
                minHeight: '48px'
            }}>
                <Activity size={16} color="var(--success)" />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Analytics</h3>
            </div>

            {/* Content */}
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
                        {/* Stats Summary */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                        }}>
                            {/* Total Detections */}
                            <div style={{
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                borderRadius: '8px',
                                padding: '0.75rem',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                    Total Detections
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                                    {analysisData.totalObjects || '0'}
                                </div>
                            </div>

                            {/* Classes */}
                            <div style={{
                                background: 'rgba(34, 197, 94, 0.1)',
                                border: '1px solid rgba(34, 197, 94, 0.2)',
                                borderRadius: '8px',
                                padding: '0.75rem',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                    Unique Classes
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#22c55e' }}>
                                    {Object.keys(analysisData.objectTypes).length || '0'}
                                </div>
                            </div>
                        </div>

                        {/* Detection Details */}
                        {analysisData.detections && analysisData.detections.length > 0 && (
                            <div style={{
                                background: 'rgba(0,0,0,0.1)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                padding: '0.75rem',
                                display: 'flex',
                                flexDirection: 'column',
                                maxHeight: '200px'
                            }}>
                                <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                                    Detections
                                </div>
                                <div style={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.25rem'
                                }}>
                                    {analysisData.detections.map((detection, index) => (
                                        <div key={index} style={{ 
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.25rem 0.5rem',
                                            background: 'var(--bg-secondary)',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem'
                                        }}>
                                            <span style={{ 
                                                fontWeight: 600, 
                                                textTransform: 'capitalize',
                                                color: 'var(--text-primary)' 
                                            }}>
                                                {detection.class}
                                            </span>
                                            <span style={{ 
                                                fontSize: '0.7rem', 
                                                color: 'var(--accent-color)',
                                                fontWeight: 'bold'
                                            }}>
                                                {detection.confidence.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Class Breakdown */}
                        {Object.keys(analysisData.objectTypes).length > 0 && (
                            <div style={{
                                background: 'rgba(0,0,0,0.1)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                padding: '0.75rem',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                                    Class Breakdown
                                </div>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.25rem'
                                }}>
                                    {Object.entries(analysisData.objectTypes).map(([type, count]) => (
                                        <div key={type} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.25rem 0.5rem',
                                            background: 'var(--bg-secondary)',
                                            borderRadius: '4px'
                                        }}>
                                            <span style={{ 
                                                fontSize: '0.75rem',
                                                fontWeight: 500, 
                                                textTransform: 'capitalize',
                                                color: 'var(--text-primary)'
                                            }}>
                                                {type}
                                            </span>
                                            <div style={{
                                                background: 'var(--accent-color)',
                                                color: 'white',
                                                borderRadius: '12px',
                                                padding: '2px 6px',
                                                fontSize: '0.7rem',
                                                fontWeight: 'bold',
                                                minWidth: '24px',
                                                textAlign: 'center'
                                            }}>
                                                {count}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Raw Analysis Text */}
                        <div style={{
                            background: 'rgba(0,0,0,0.1)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '0.75rem',
                            fontSize: '0.7rem',
                            lineHeight: '1.4',
                            whiteSpace: 'pre-wrap',
                            flex: 1,
                            minHeight: '100px',
                            overflowY: 'auto'
                        }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                Raw Analysis
                            </div>
                            <div style={{ color: 'var(--text-primary)' }}>
                                {markdownContent}
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)',
                        fontStyle: 'italic',
                        fontSize: '0.85rem',
                        textAlign: 'center',
                        padding: '2rem 1rem'
                    }}>
                        Select an image to view detailed analytics
                    </div>
                )}
            </div>
        </div>
    );
};
