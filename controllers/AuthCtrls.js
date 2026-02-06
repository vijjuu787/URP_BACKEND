export const login = async (req, res) => {
  console.log(req.body);
  res.json({ message: "Login endpoint hit" });
};
