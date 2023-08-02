import { queryParamsStringify } from './queryParamsStringify';

describe('queryParamsStringify', () => {
  test('should stringify array params correctly', () => {
    const params = {
      ids: ['1', '2', '3'],
    };
    expect(queryParamsStringify(params)).toEqual('ids=1&ids=2&ids=3');
  });

  test('should stringify array params correctly when there are other params', () => {
    const params = {
      ids: ['1', '2', '3'],
      other: 'param',
    };
    expect(queryParamsStringify(params)).toEqual(
      'ids=1&ids=2&ids=3&other=param'
    );
  });
});
