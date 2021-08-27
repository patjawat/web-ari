const updateVisits = (state = [], action) => {
    if (action.type === 'ADD_VISIT') {
      return [...new Set([...state, action.visit])];
    }
    return state;
  };
  export default updateVisits;
  