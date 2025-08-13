import React, {useState, useRef, useEffect} from 'react';
import {
    Mic, Play, Pause, Square, History, Edit3, Save, X, Upload, RotateCcw,
    CheckCircle2, AlertTriangle, Loader, Hourglass
} from 'lucide-react';
import api, {API_URL} from "../lib/api.ts";
import type { RecordingItem } from '../openapi/models/RecordingItem.ts';

type Status = "queued" | "processing" | "completed" | "failed";

interface RecordingItemElement extends Omit<RecordingItem, 'recordingId' | 'failReason'> {
    status: Status;
    recordingId: string;
    transcription: string;
    failReason: string | null;
}

interface RecordingSectionProps {
    onSubmitRecording: () => void;
}

interface EditDialogProps {
    transcript: RecordingItemElement | null;
    onSave: (newText: string) => void;
    onCancel: () => void;
}

interface HistoryItemProps {
    item: RecordingItemElement;
    onEdit: (item: RecordingItemElement) => void;
}


const RecordingSection: React.FC<RecordingSectionProps> = ({onSubmitRecording}) => {
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [recordingTime, setRecordingTime] = useState<number>(0);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (isRecording) {
            timerRef.current = window.setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
            setRecordingTime(0);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRecording]);

    useEffect(() => {
        if (recordedBlob) {
            const audio = new Audio(URL.createObjectURL(recordedBlob));
            audioRef.current = audio;
            const updateTime = () => setCurrentTime(audio.currentTime);
            const updateDuration = () => setDuration(audio.duration);
            const onEnded = () => {
                setIsPlaying(false);
                setCurrentTime(0);
            };
            audio.addEventListener('timeupdate', updateTime);
            audio.addEventListener('loadedmetadata', updateDuration);
            audio.addEventListener('ended', onEnded);
            return () => {
                audio.removeEventListener('timeupdate', updateTime);
                audio.removeEventListener('loadedmetadata', updateDuration);
                audio.removeEventListener('ended', onEnded);
                audio.pause();
                audioRef.current = null;
            };
        }
    }, [recordedBlob]);


    const startRecording = async (): Promise<void> => {
        resetRecording();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({audio: true});
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = (event: BlobEvent) => audioChunksRef.current.push(event.data);
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, {type: 'audio/wav'});
                setRecordedBlob(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Error accessing microphone. Please ensure microphone permissions are granted.');
        }
    };

    const stopRecording = (): void => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const togglePlayback = (): void => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().then();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>): void => {
        if (!audioRef.current || !duration) return;
        const seekTime = (parseFloat(e.target.value) / 100) * duration;
        audioRef.current.currentTime = seekTime;
        setCurrentTime(seekTime);
    };

    const resetRecording = (): void => {
        setRecordedBlob(null);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
    };

    const submitRecording = async (): Promise<void> => {
        if (!recordedBlob) return;
        setIsSubmitting(true);
        try {
            await api.newRecordingApiRecordingPost({recording: recordedBlob});
            onSubmitRecording();
            resetRecording();
        } catch (error) {
            console.error('Error submitting recording:', error);
            alert('Error submitting recording. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds: number): string => {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 space-y-4 text-center">
                <div className="space-y-2">
                    {/*<h2 className="text-2xl font-bold">Speech to text</h2>*/}
                    <p className="text-gray-400">Convert your voice to text.</p>
                </div>
                {!recordedBlob && (
                    <div className="flex flex-col items-center gap-2 py-2">
                        {!isRecording ? (
                            <button
                                onClick={startRecording}
                                disabled={isSubmitting}
                                className="w-13 h-13 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-4 focus:ring-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                            >
                                <Mic className="w-6 h-6 text-white"/>
                            </button>
                        ) : (
                            <button
                                onClick={stopRecording}
                                className="w-13 h-13 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-500/50 transition-all transform hover:scale-105 animate-pulse"
                            >
                                <Square className="w-6 h-6 text-white"/>
                            </button>
                        )}
                        <div className="h-12 flex flex-col justify-center">
                            {isRecording ? (
                                <div className="space-y-1">
                                    <p className="text-red-400 font-medium">Recording...</p>
                                    <p className="text-xl font-mono text-white">{formatTime(recordingTime)}</p>
                                </div>
                            ) : (
                                <p className="text-gray-400">Click the mic to begin</p>
                            )}
                        </div>
                    </div>
                )}
                {recordedBlob && !isRecording && (
                    <div className="space-y-5 pt-2">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={togglePlayback}
                                className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors flex-shrink-0 focus:outline-none focus:ring-4 focus:ring-purple-500/50"
                            >
                                {isPlaying ? (
                                    <Pause className="w-6 h-6 text-white"/>
                                ) : (
                                    <Play className="w-6 h-6 text-white ml-1"/>
                                )}
                            </button>
                            <div className="flex-1 min-w-0">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={duration ? (currentTime / duration) * 100 : 0}
                                    onChange={handleSeek}
                                    disabled={!duration}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <div className="flex justify-between text-xs text-gray-400 font-mono mt-1.5 px-1">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center items-center gap-4 pt-3">
                            <button
                                onClick={resetRecording}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                            >
                                <RotateCcw className="w-4 h-4"/>
                                Record Again
                            </button>
                            <button
                                onClick={submitRecording}
                                disabled={isSubmitting}
                                className="flex-1 max-w-xs flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div
                                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Submitting...</>
                                ) : (
                                    <><Upload className="w-4 h-4"/>Submit Recording</>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


const EditDialog: React.FC<EditDialogProps> = ({transcript, onSave, onCancel}) => {
    const [editText, setEditText] = useState<string>('');

    useEffect(() => {
        if (transcript) {
            setEditText(transcript.transcription || '');
        }
    }, [transcript]);

    if (!transcript) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg w-full max-w-2xl border border-gray-700">
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <h3 className="text-xl font-semibold text-white">Edit Transcript</h3>
                    <button onClick={onCancel}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
                        <X className="w-4 h-4"/>
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="text-sm text-gray-400">{new Date(transcript.date).toLocaleString()}</div>
                    <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full h-40 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
                        placeholder="Edit transcript..."
                    />
                    <div className="flex gap-3 justify-end">
                        <button onClick={onCancel}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors">
                            <X className="w-4 h-4"/>Cancel
                        </button>
                        <button onClick={() => onSave(editText)}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            <Save className="w-4 h-4"/>Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const HistoryItem: React.FC<HistoryItemProps> = ({item, onEdit}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const isPending = item.status === 'queued' || item.status === 'processing';
    const streamUrl = `${API_URL}/api/recording/${item.recordingId}`;

    const statusConfig = {
        completed: {icon: CheckCircle2, color: 'text-green-500', borderColor: 'border-gray-700', label: 'Completed'},
        processing: {
            icon: Loader,
            color: 'text-purple-400',
            borderColor: 'border-purple-500/30',
            label: 'Processing...'
        },
        queued: {icon: Hourglass, color: 'text-sky-400', borderColor: 'border-sky-500/30', label: 'Queued'},
        failed: {icon: AlertTriangle, color: 'text-red-500', borderColor: 'border-red-500/30', label: 'Failed'},
    };

    const {icon: Icon, color, borderColor, label} = statusConfig[item.status];

    const playAudio = () => {
        if (audioRef.current && isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            return;
        }

        const audio = audioRef.current ?? new Audio(streamUrl);
        audioRef.current = audio;

        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
            setIsPlaying(false);
            alert('Error playing audio.');
        };
        audio.play().catch(console.error);
        setIsPlaying(true);
    };

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    return (
        <div className={`bg-gray-900 rounded-lg p-5 border ${borderColor} transition-colors`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className={`flex items-center gap-3 font-medium ${color}`}>
                    <Icon className={`w-5 h-5 ${item.status === 'processing' ? 'animate-spin' : ''}`}/>
                    <span>{label}</span>
                    <span className="text-gray-500 text-sm font-normal"> - {new Date(item.date).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={playAudio}
                        disabled={isPending || item.status === 'failed'}
                        className="w-9 h-9 flex items-center justify-center bg-purple-600 rounded-full hover:bg-purple-700 transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed"
                    >
                        {isPlaying ? <Pause className="w-4 h-4 text-white"/> :
                            <Play className="w-4 h-4 text-white ml-0.5"/>}
                    </button>
                    <button
                        onClick={() => onEdit(item)}
                        disabled={isPending}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Edit3 className="w-3 h-3"/>
                        Edit
                    </button>
                </div>
            </div>

            {/* Body */}
            <div>
                {item.status === 'completed' && <p className="text-gray-300 leading-relaxed">{item.transcription}</p>}
                {isPending &&
                    <p className="text-gray-500 italic">Transcription will appear here once processing is complete.</p>}
                {item.status === 'failed' && (
                    <div className="bg-red-500/10 text-red-400 p-3 rounded-md text-sm">
                        <strong>Error:</strong> {item.failReason || 'An unknown error occurred.'}
                    </div>
                )}
            </div>
        </div>
    );
};

const TranscriptHistory: React.FC<{
    transcripts: RecordingItemElement[],
    onEdit: (item: RecordingItemElement) => void
}> = ({transcripts, onEdit}) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <History className="w-6 h-6 text-purple-400"/>
                <h2 className="text-2xl font-bold">Transcript History</h2>
            </div>
            {transcripts.length === 0 ? (
                <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-gray-800">
                    <Mic className="w-16 h-16 text-gray-600 mx-auto mb-4"/>
                    <p className="text-gray-400 text-lg">No transcripts yet</p>
                    <p className="text-gray-500">Your recordings will appear here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {transcripts.map((item) => (
                        <HistoryItem key={item.recordingId} item={item} onEdit={onEdit}/>
                    ))}
                </div>
            )}
        </div>
    );
};

const VoxApp: React.FC = () => {
    const [transcriptHistory, setTranscriptHistory] = useState<RecordingItemElement[]>([]);
    const [editingTranscript, setEditingTranscript] = useState<RecordingItemElement | null>(null);

    const loadTranscriptHistory = async (): Promise<void> => {
        try {
            // The type assertion ensures the fetched data matches our extended interface
            const history = await api.listRecordingApiRecordingGet() as unknown as { recordings: RecordingItemElement[] };
            setTranscriptHistory(history.recordings);
        } catch (error) {
            console.error('Failed to load transcript history:', error);
        }
    };

    // Polling effect
    useEffect(() => {
        // Initial load
        loadTranscriptHistory();

        const hasPendingItems = transcriptHistory.some(item => item.status === 'queued' || item.status === 'processing');
        let intervalId: number | null = null;

        if (hasPendingItems) {
            intervalId = window.setInterval(loadTranscriptHistory, 2000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [transcriptHistory.map(t => t.status).join(',')]); // Re-run effect if statuses change

    const handleEditSave = async (newText: string): Promise<void> => {
        if (!editingTranscript) return;
        console.log('Updating transcript:', editingTranscript.recordingId, 'New text:', newText);
        // Replace with your actual API call to update the transcript
        // await api.updateTranscript(editingTranscript.recordingId, newText);
        setEditingTranscript(null);
        await loadTranscriptHistory(); // Refresh after saving
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans">
            <header className="border-b border-gray-800">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-center">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                            <Mic className="w-5 h-5 text-white"/>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Vox</h1>
                    </div>
                </div>
            </header>
            <main className="max-w-4xl mx-auto px-6 py-8 space-y-12">
                <RecordingSection onSubmitRecording={loadTranscriptHistory}/>
                <hr className="border-gray-800"/>
                <TranscriptHistory transcripts={transcriptHistory} onEdit={setEditingTranscript}/>
            </main>
            <EditDialog transcript={editingTranscript} onSave={handleEditSave}
                        onCancel={() => setEditingTranscript(null)}/>
        </div>
    );
};

export default VoxApp;