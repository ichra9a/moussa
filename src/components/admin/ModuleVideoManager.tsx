
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Video, ExternalLink, Trash2, Plus, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import VideoVerificationForm from './VideoVerificationForm';
import VideoQuestionEditor from './VideoQuestionEditor';

interface VerificationQuestion {
  question_text: string;
  correct_answer: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

interface ModuleVideo {
  id: string;
  order_index: number;
  videos: {
    id: string;
    title: string;
    youtube_id: string;
    duration_seconds: number;
    thumbnail: string;
  };
}

interface ModuleVideoManagerProps {
  moduleId: string;
  moduleVideos: ModuleVideo[];
  onVideosUpdated: () => void;
}

const ModuleVideoManager = ({ moduleId, moduleVideos, onVideosUpdated }: ModuleVideoManagerProps) => {
  const { toast } = useToast();
  const [addingVideo, setAddingVideo] = useState(false);
  const [editingQuestions, setEditingQuestions] = useState<string | null>(null);
  const [videoFormData, setVideoFormData] = useState({
    title: '',
    youtubeUrl: '',
    orderIndex: 1
  });
  const [verificationQuestions, setVerificationQuestions] = useState<VerificationQuestion[]>([]);

  const extractYouTubeId = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  const validateVerificationQuestions = (questions: VerificationQuestion[]) => {
    return questions.every(q => 
      q.question_text.trim() !== '' &&
      q.option_a.trim() !== '' &&
      q.option_b.trim() !== '' &&
      q.option_c.trim() !== '' &&
      q.option_d.trim() !== ''
    );
  };

  const getNextAvailableOrderIndex = () => {
    if (!moduleVideos || moduleVideos.length === 0) return 1;
    const maxOrder = Math.max(...moduleVideos.map(mv => mv.order_index));
    return maxOrder + 1;
  };

  const handleAddVideoToModule = async () => {
    if (!videoFormData.title.trim() || !videoFormData.youtubeUrl.trim()) {
      toast({
        title: "خطأ",
        description: "يجب ملء عنوان الفيديو ورابط اليوتيوب",
        variant: "destructive"
      });
      return;
    }

    const youtubeId = extractYouTubeId(videoFormData.youtubeUrl);
    if (!youtubeId) {
      toast({
        title: "خطأ",
        description: "رابط يوتيوب غير صحيح",
        variant: "destructive"
      });
      return;
    }

    if (verificationQuestions.length > 0 && !validateVerificationQuestions(verificationQuestions)) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع حقول الأسئلة المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setAddingVideo(true);

    try {
      // Get the next available order index to avoid duplicates
      const orderIndex = videoFormData.orderIndex || getNextAvailableOrderIndex();

      // Check if order index already exists for this module
      const { data: existingVideo } = await supabase
        .from('module_videos')
        .select('id')
        .eq('module_id', moduleId)
        .eq('order_index', orderIndex)
        .maybeSingle();

      if (existingVideo) {
        toast({
          title: "خطأ",
          description: `الترتيب ${orderIndex} موجود بالفعل. سيتم استخدام الترتيب التالي المتاح.`,
          variant: "destructive"
        });
        // Use the next available order index
        const nextOrder = getNextAvailableOrderIndex();
        setVideoFormData(prev => ({ ...prev, orderIndex: nextOrder }));
        return;
      }

      // First, create the video
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          title: videoFormData.title,
          youtube_url: videoFormData.youtubeUrl,
          youtube_id: youtubeId,
          thumbnail: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
        })
        .select()
        .single();

      if (videoError) throw videoError;

      // Then, add it to the module
      const { error: moduleVideoError } = await supabase
        .from('module_videos')
        .insert({
          module_id: moduleId,
          video_id: videoData.id,
          order_index: orderIndex
        });

      if (moduleVideoError) throw moduleVideoError;

      // Add verification questions if any
      if (verificationQuestions.length > 0) {
        const questionsToInsert = verificationQuestions.map(q => ({
          video_id: videoData.id,
          question_text: q.question_text,
          correct_answer: q.correct_answer,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d
        }));

        const { error: questionsError } = await supabase
          .from('video_verification_questions')
          .insert(questionsToInsert);

        if (questionsError) throw questionsError;
      }

      toast({
        title: "تم الإضافة",
        description: `تم إضافة الفيديو للوحدة بنجاح${verificationQuestions.length > 0 ? ' مع أسئلة التحقق' : ''}`
      });

      setVideoFormData({ title: '', youtubeUrl: '', orderIndex: getNextAvailableOrderIndex() });
      setVerificationQuestions([]);
      onVideosUpdated();
    } catch (error) {
      console.error('Error adding video to module:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة الفيديو",
        variant: "destructive"
      });
    } finally {
      setAddingVideo(false);
    }
  };

  const handleRemoveVideoFromModule = async (moduleVideoId: string) => {
    try {
      const { error } = await supabase
        .from('module_videos')
        .delete()
        .eq('id', moduleVideoId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الفيديو من الوحدة"
      });

      onVideosUpdated();
    } catch (error) {
      console.error('Error removing video from module:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الفيديو",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium arabic-text mb-3 flex items-center gap-2">
          <Video className="h-4 w-4" />
          فيديوهات الوحدة ({moduleVideos?.length || 0})
        </h4>
        
        {moduleVideos && moduleVideos.length > 0 ? (
          <div className="space-y-4">
            {moduleVideos
              .sort((a, b) => a.order_index - b.order_index)
              .map((moduleVideo) => (
              <div key={moduleVideo.id} className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">{moduleVideo.order_index}</span>
                    </div>
                    <div>
                      <p className="font-medium arabic-text">{moduleVideo.videos.title}</p>
                      <p className="text-sm text-gray-500">YouTube ID: {moduleVideo.videos.youtube_id}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingQuestions(
                        editingQuestions === moduleVideo.videos.id ? null : moduleVideo.videos.id
                      )}
                      className="arabic-text"
                    >
                      <Settings className="h-4 w-4" />
                      {editingQuestions === moduleVideo.videos.id ? 'إخفاء' : 'أسئلة'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`https://youtube.com/watch?v=${moduleVideo.videos.youtube_id}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveVideoFromModule(moduleVideo.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {editingQuestions === moduleVideo.videos.id && (
                  <VideoQuestionEditor
                    videoId={moduleVideo.videos.id}
                    videoTitle={moduleVideo.videos.title}
                    onQuestionsUpdated={onVideosUpdated}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 arabic-text text-sm">لا توجد فيديوهات في هذه الوحدة</p>
        )}
      </div>

      <div className="border-t pt-4">
        <h5 className="font-medium arabic-text mb-3">إضافة فيديو من يوتيوب</h5>
        <div className="space-y-3">
          <div>
            <Input
              placeholder="عنوان الفيديو *"
              value={videoFormData.title}
              onChange={(e) => setVideoFormData({ ...videoFormData, title: e.target.value })}
              className="arabic-text"
              disabled={addingVideo}
            />
          </div>
          <div>
            <Input
              placeholder="رابط يوتيوب (https://youtube.com/watch?v=...) *"
              value={videoFormData.youtubeUrl}
              onChange={(e) => setVideoFormData({ ...videoFormData, youtubeUrl: e.target.value })}
              dir="ltr"
              className="text-left"
              disabled={addingVideo}
            />
          </div>
          <div className="flex gap-3">
            <div className="w-24">
              <Input
                type="number"
                placeholder="ترتيب"
                value={videoFormData.orderIndex}
                onChange={(e) => setVideoFormData({ ...videoFormData, orderIndex: parseInt(e.target.value) || getNextAvailableOrderIndex() })}
                min="1"
                disabled={addingVideo}
              />
            </div>
            <Button
              onClick={handleAddVideoToModule}
              disabled={!videoFormData.title.trim() || !videoFormData.youtubeUrl.trim() || addingVideo}
              className="arabic-text"
            >
              {addingVideo ? 'جاري الإضافة...' : (
                <>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة فيديو
                </>
              )}
            </Button>
          </div>

          <div className="mt-6 border-t pt-4">
            <VideoVerificationForm
              questions={verificationQuestions}
              onQuestionsChange={setVerificationQuestions}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleVideoManager;
