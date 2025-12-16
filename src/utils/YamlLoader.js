import jsyaml from 'js-yaml';

export const loadStory = async () => {
  try {
    const response = await fetch('/structure.yaml');
    if (!response.ok) {
      throw new Error(`Failed to load story: ${response.statusText}`);
    }
    const text = await response.text();
    return jsyaml.load(text);
  } catch (error) {
    console.error('Error loading YAML:', error);
    return null;
  }
};
