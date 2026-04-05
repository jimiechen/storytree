'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter, ModalClose } from '@/components/ui/Modal';
import { api } from '@/lib/api';

interface CreateProjectModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated: () => void;
}

export function CreateProjectModal({ isOpen, onOpenChange, onProjectCreated }: CreateProjectModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = '项目标题不能为空';
    }

    if (!description.trim()) {
      newErrors.description = '项目描述不能为空';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/projects', {
        title,
        description,
        status,
      });

      // 重置表单
      setTitle('');
      setDescription('');
      setStatus('active');
      setErrors({});

      // 关闭弹窗
      onOpenChange(false);

      // 通知父组件项目已创建
      onProjectCreated();
    } catch (error) {
      console.error('Failed to create project:', error);
      setErrors({ general: '创建项目失败，请稍后重试' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} title="新建项目" className="sm:max-w-md">
      <div className="space-y-4 py-4">
          {errors.general && (
            <div className="text-red-500 text-sm">
              {errors.general}
            </div>
          )}

          <Input
            name="title"
            label="项目标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
          />

          <Textarea
            name="description"
            label="项目描述"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={errors.description}
            placeholder="请输入项目描述"
          />

          <Select 
            label="项目状态"
            value={status} 
            onChange={setStatus}
            items={[
              { label: '进行中', value: 'active' },
              { label: '草稿', value: 'draft' },
              { label: '已完成', value: 'completed' },
            ]}
          />
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            创建
          </Button>
        </div>
    </Modal>
  );
}
