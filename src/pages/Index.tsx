import { useState, useCallback } from "react";
import AuditHeader from "@/components/AuditHeader";
import StepCard from "@/components/StepCard";
import FileUploadZone, { type UploadedFile } from "@/components/FileUploadZone";
import CategorySelector, { CATEGORIES } from "@/components/CategorySelector";
import AnalyseButton from "@/components/AnalyseButton";
import ResultsPanel from "@/components/ResultsPanel";
import { analyseDocuments, type AuditResult } from "@/lib/puter-ai";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [regulationFiles, setRegulationFiles] = useState<UploadedFile[]>([]);
  const [documentFiles, setDocumentFiles] = useState<UploadedFile[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [analysing, setAnalysing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [progressMessage, setProgressMessage] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const { toast } = useToast();

  const addFiles = useCallback(
    (setter: React.Dispatch<React.SetStateAction<UploadedFile[]>>) =>
      (fileList: FileList) => {
        const newFiles = Array.from(fileList).map((file) => ({
          file,
          id: crypto.randomUUID(),
        }));
        setter((prev) => [...prev, ...newFiles]);
      },
    []
  );

  const removeFile = useCallback(
    (setter: React.Dispatch<React.SetStateAction<UploadedFile[]>>) =>
      (id: string) => {
        setter((prev) => prev.filter((f) => f.id !== id));
      },
    []
  );

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleAnalyse = async () => {
    setAnalysing(true);
    setShowResults(false);
    setAuditResult(null);

    try {
      const categoryNames = selectedCategories.map(
        (id) => CATEGORIES.find((c) => c.id === id)?.name || id
      );

      const result = await analyseDocuments(
        regulationFiles.map((f) => f.file),
        documentFiles.map((f) => f.file),
        categoryNames,
        (msg, pct) => {
          setProgressMessage(msg);
          setProgressPercent(pct);
        }
      );

      setAuditResult(result);
      setShowResults(true);
      toast({ title: "Analysis Complete", description: `Found ${result.totalFindings} findings across your documents.` });
    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnalysing(false);
    }
  };

  const canAnalyse = documentFiles.length > 0 && selectedCategories.length > 0;

  return (
    <div className="min-h-screen relative z-[1]">
      <AuditHeader />
      <main className="max-w-[1100px] mx-auto px-5 py-8 pb-16">
        <StepCard
          number={1}
          title="UPLOAD REGULATIONS"
          subtitle="Upload SA regulation PDFs (PFMA, OHS Act, BCEA, POPIA, NEMA, King IV, etc.)"
          active={regulationFiles.length === 0}
          done={regulationFiles.length > 0}
        >
          <FileUploadZone
            label="Regulation Documents"
            sublabel="Upload SA regulation PDFs (PFMA, OHS Act, BCEA, POPIA, NEMA, King IV, etc.)"
            files={regulationFiles}
            onAdd={addFiles(setRegulationFiles)}
            onRemove={removeFile(setRegulationFiles)}
          />
        </StepCard>

        <StepCard
          number={2}
          title="UPLOAD DOCUMENTS TO AUDIT"
          subtitle="Upload the documents you want to audit against the regulations above"
          active={regulationFiles.length > 0 && documentFiles.length === 0}
          done={documentFiles.length > 0}
        >
          <FileUploadZone
            label="Documents to Audit"
            sublabel="Upload the documents you want to audit against the regulations above"
            files={documentFiles}
            onAdd={addFiles(setDocumentFiles)}
            onRemove={removeFile(setDocumentFiles)}
          />
        </StepCard>

        <StepCard
          number={3}
          title="SELECT AUDIT CATEGORIES"
          subtitle="Choose which SA regulations to compare the document content against"
          active={documentFiles.length > 0 && selectedCategories.length === 0}
          done={selectedCategories.length > 0}
        >
          <CategorySelector
            selected={selectedCategories}
            onToggle={toggleCategory}
            onSelectAll={() => setSelectedCategories(CATEGORIES.map((c) => c.id))}
            onClear={() => setSelectedCategories([])}
          />
        </StepCard>

        <StepCard
          number={4}
          title="AI COMPLIANCE ANALYSIS"
          subtitle="AI reads the actual document content and compares it against the selected regulations"
          active={canAnalyse && !showResults}
          done={showResults}
        >
          {!showResults && (
            <AnalyseButton
              disabled={!canAnalyse}
              loading={analysing}
              onClick={handleAnalyse}
              progressMessage={progressMessage}
              progressPercent={progressPercent}
            />
          )}
          <ResultsPanel visible={showResults} result={auditResult} />
        </StepCard>
      </main>
    </div>
  );
};

export default Index;
