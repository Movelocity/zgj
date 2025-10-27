import { useState, useEffect } from 'react';
import { siteVariableAPI } from '@/api/siteVariable';

/**
 * 获取网站变量的 Hook
 * @param key 变量键名
 * @returns { value, description, loading, error, refresh }
 */
export const useSiteVariable = (key: string) => {
  const [value, setValue] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVariable = async () => {
    if (!key) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await siteVariableAPI.getSiteVariableByKey(key);
      
      if (response.code === 0) {
        setValue(response.data.value);
        setDescription(response.data.description);
      } else {
        setError(response.msg || '获取变量失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取变量失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariable();
  }, [key]);

  return {
    value,
    description,
    loading,
    error,
    refresh: fetchVariable,
  };
};

/**
 * 批量获取多个网站变量的 Hook
 * @param keys 变量键名数组
 * @returns { variables, loading, error, refresh }
 */
export const useSiteVariables = (keys: string[]) => {
  const [variables, setVariables] = useState<Record<string, { value: string; description: string }>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVariables = async () => {
    if (!keys || keys.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // 并行请求所有变量
      const promises = keys.map(key => 
        siteVariableAPI.getSiteVariableByKey(key)
          .then(response => ({ key, response }))
          .catch(err => ({ key, error: err }))
      );
      
      const results = await Promise.all(promises);
      
      const variablesMap: Record<string, { value: string; description: string }> = {};
      
      results.forEach(result => {
        if ('response' in result && result.response.code === 0) {
          variablesMap[result.key] = {
            value: result.response.data.value,
            description: result.response.data.description,
          };
        }
      });
      
      setVariables(variablesMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取变量失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariables();
  }, [JSON.stringify(keys)]);

  return {
    variables,
    loading,
    error,
    refresh: fetchVariables,
  };
};

