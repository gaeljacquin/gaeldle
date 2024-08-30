// Fixes BigInt error
const json = (param: any): any => {
  return JSON.stringify(param, (_ /** key */, value) =>
    typeof value === 'bigint' ? value.toString() : value,
  );
};

export default json;
