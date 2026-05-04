import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  guide: string;
}

export function OnboardingGuide({ guide }: Props) {
  return (
    <div className="card animate-fade-in">
      <div className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{guide}</ReactMarkdown>
      </div>
    </div>
  );
}
