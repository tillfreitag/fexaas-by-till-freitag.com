import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Check, X, ArrowUpDown, Search, Filter, AlertTriangle, Copy, Trash2 } from "lucide-react";
import type { FAQItem } from "@/types/faq";
interface FAQTableProps {
  faqs: FAQItem[];
  onUpdate: (faqs: FAQItem[]) => void;
}
export const FAQTable = ({
  faqs,
  onUpdate
}: FAQTableProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<FAQItem>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterConfidence, setFilterConfidence] = useState<string>("all");
  const [sortBy, setSortBy] = useState<keyof FAQItem>("extractedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const categories = useMemo(() => {
    const cats = Array.from(new Set(faqs.map(faq => faq.category)));
    return cats.sort();
  }, [faqs]);
  const filteredAndSortedFAQs = useMemo(() => {
    let filtered = faqs.filter(faq => {
      const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) || faq.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === "all" || faq.category === filterCategory;
      const matchesConfidence = filterConfidence === "all" || faq.confidence === filterConfidence;
      return matchesSearch && matchesCategory && matchesConfidence;
    });
    return filtered.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comparison = aVal.localeCompare(bVal);
        return sortOrder === "asc" ? comparison : -comparison;
      }
      return 0;
    });
  }, [faqs, searchTerm, filterCategory, filterConfidence, sortBy, sortOrder]);
  const handleEdit = (faq: FAQItem) => {
    setEditingId(faq.id);
    setEditForm({
      ...faq
    });
  };
  const handleSave = () => {
    if (!editingId || !editForm) return;
    const updatedFaqs = faqs.map(faq => faq.id === editingId ? {
      ...faq,
      ...editForm
    } : faq);
    onUpdate(updatedFaqs);
    setEditingId(null);
    setEditForm({});
  };
  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };
  const handleDelete = (id: string) => {
    const updatedFaqs = faqs.filter(faq => faq.id !== id);
    onUpdate(updatedFaqs);
  };
  const handleAddNew = () => {
    const newFaq: FAQItem = {
      id: `faq-${Date.now()}`,
      question: "New Question",
      answer: "New Answer",
      category: "General",
      sourceUrl: "",
      confidence: "medium",
      isIncomplete: false,
      isDuplicate: false,
      extractedAt: new Date().toISOString()
    };
    onUpdate([...faqs, newFaq]);
    handleEdit(newFaq);
  };
  const handleSort = (field: keyof FAQItem) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };
  return <div className="space-y-4">
      {/* Filters and Controls */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search questions, answers, or categories..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterConfidence} onValueChange={setFilterConfidence}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by confidence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Confidence</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleAddNew} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              Add FAQ
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredAndSortedFAQs.length} of {faqs.length} FAQs
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 font-medium text-gray-700">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('question')} className="hover:bg-gray-100 -ml-2">
                    Question
                    <ArrowUpDown className="h-4 w-4 ml-1" />
                  </Button>
                </th>
                <th className="text-left p-4 font-medium text-gray-700">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('answer')} className="hover:bg-gray-100 -ml-2">
                    Answer
                    <ArrowUpDown className="h-4 w-4 ml-1" />
                  </Button>
                </th>
                <th className="text-left p-4 font-medium text-gray-700">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('category')} className="hover:bg-gray-100 -ml-2">
                    Category
                    <ArrowUpDown className="h-4 w-4 ml-1" />
                  </Button>
                </th>
                <th className="text-left p-4 font-medium text-gray-700">Confidence</th>
                <th className="text-left p-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedFAQs.map((faq, index) => <tr key={faq.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  {editingId === faq.id ? <>
                      <td className="p-4">
                        <Textarea value={editForm.question || ""} onChange={e => setEditForm({
                    ...editForm,
                    question: e.target.value
                  })} className="min-h-16" />
                      </td>
                      <td className="p-4">
                        <Textarea value={editForm.answer || ""} onChange={e => setEditForm({
                    ...editForm,
                    answer: e.target.value
                  })} className="min-h-16" />
                      </td>
                      <td className="p-4">
                        <Input value={editForm.category || ""} onChange={e => setEditForm({
                    ...editForm,
                    category: e.target.value
                  })} />
                      </td>
                      <td className="p-4">
                        <Select value={editForm.confidence || "medium"} onValueChange={value => setEditForm({
                    ...editForm,
                    confidence: value as 'high' | 'medium' | 'low'
                  })}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </> : <>
                      <td className="p-4 max-w-80">
                        <div className="font-medium text-gray-900 line-clamp-3">{faq.question}</div>
                      </td>
                      <td className="p-4 max-w-96">
                        <div className="text-gray-700 line-clamp-3">{faq.answer}</div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="whitespace-nowrap">{faq.category}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <Badge variant={faq.confidence === 'high' ? 'default' : faq.confidence === 'medium' ? 'secondary' : 'destructive'} className="w-fit">
                            {faq.confidence}
                          </Badge>
                          {faq.isIncomplete && <Badge variant="outline" className="text-orange-600 border-orange-300 w-fit">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Incomplete
                            </Badge>}
                          {faq.isDuplicate && <Badge variant="outline" className="text-red-600 border-red-300 w-fit">
                              <Copy className="h-3 w-3 mr-1" />
                              Duplicate
                            </Badge>}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(faq)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(faq.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </>}
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>;
};