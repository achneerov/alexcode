export interface Problem {
  description: string;
  solution?: string;
  function_params_names: string[];
  test_cases: TestCase[];
}

export interface TestCase {
  id: number;
  input: {
    nums: number[];
    target: number;
  };
  output: number[];
}
