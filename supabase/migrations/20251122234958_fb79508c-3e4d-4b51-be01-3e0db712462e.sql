-- Create function to automatically set section_completed based on video and quiz status
CREATE OR REPLACE FUNCTION public.compute_section_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- If section has no quiz, section is complete when video is complete
  -- If section has quiz, section is complete when both video and quiz are complete
  IF NEW.has_quiz = false THEN
    NEW.section_completed := NEW.video_completed;
  ELSE
    NEW.section_completed := (NEW.video_completed AND NEW.quiz_passed);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to compute section_completed before insert or update
DROP TRIGGER IF EXISTS set_section_completed ON public.course_progress;
CREATE TRIGGER set_section_completed
  BEFORE INSERT OR UPDATE ON public.course_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_section_completed();