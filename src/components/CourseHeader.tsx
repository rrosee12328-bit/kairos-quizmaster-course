import { Shield, BookOpen, Users } from "lucide-react";

const CourseHeader = () => {
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className="h-12 w-12" />
            <div>
              <h1 className="text-3xl font-bold">Kairos Security Academy</h1>
              <p className="text-primary-foreground/80 text-lg">Professional Security Training</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              <span>9 Sections</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>100 Questions</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default CourseHeader;