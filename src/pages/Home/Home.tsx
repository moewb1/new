import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addBy,
  decrement,
  increment,
  incrementAsync,
} from "@/store/slices/counterSlice";

const Home = () => {
  const { value, loading } = useAppSelector((s) => s.counter);
  const dispatch = useAppDispatch();
  return (
    <div>
      <p>
        Count: {value} {loading && "…"}
      </p>
      <button onClick={() => dispatch(decrement())}>-</button>
      <button onClick={() => dispatch(increment())}>+</button>
      <button onClick={() => dispatch(addBy(5))}>+5</button>
      <button onClick={() => dispatch(incrementAsync(10))}>+10 (async)</button>
    </div>
  );
};

export default Home;
