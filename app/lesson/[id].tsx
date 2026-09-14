import { useLocalSearchParams } from 'expo-router';
import { LessonScreen } from '../../features/lesson/screens/LessonScreen';

export default function LessonRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LessonScreen lessonId={id} />;
}
